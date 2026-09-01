using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Assets;

namespace Sft.Capture.Reader;

/// The text an entry carries, read from the export that holds it.
///
/// The client ships no localisation resource at all — no `.locres` is indexed,
/// and the one locale container holds three textures and a voice line. The
/// English text is in the entry's own asset, as the source string of an `FText`,
/// and it is the template Riot writes rather than a rendering of it:
/// `&lt;TFTCurveTable row="AbilityCenterHexRange"/&gt;` and not a number.
///
/// Which field a text belongs to is the class of the export holding it —
/// `TFTNameDataComponent` for the name, `TFTSpellDescriptionDataComponent` for
/// the description. Position will not do it: one champion carries two names
/// before its ability and another carries a title there.
public static class Text
{
    public sealed record Line(string Component, string Key, string Source);

    // An `FText` cooked into a package ends in three length-prefixed strings:
    // namespace, key, source. The client leaves the namespace empty and lets the
    // editor generate the key, which comes out as 32 hex digits — and that is
    // what makes a text findable without knowing where in the export it sits,
    // and so without a property schema. A length counts the terminator.
    private const int KeyLength = 32;
    private const int Longest = 8192;

    public static IReadOnlyList<Line> Read(
        AbstractFileProvider provider, string path, out string? refused)
    {
        refused = null;
        var bytes = provider.SaveAsset(path);
        if (provider.LoadPackage(path) is not IoPackage io)
        {
            refused = "not an IoStore package";
            return [];
        }

        var payload = bytes.Length - io.ExportMap.Sum(e => (long) e.CookedSerialSize);
        if (payload < 0)
        {
            refused = $"the exports leave no payload in {bytes.Length} bytes";
            return [];
        }

        var lines = new List<Line>();
        for (var e = 0; e < io.ExportMap.Length; e++)
        {
            var export = io.ExportMap[e];
            var from = (int) (payload + (long) export.CookedSerialOffset);
            var to = from + (int) export.CookedSerialSize;
            if (from < 0 || to > bytes.Length)
            {
                refused = $"export {e} of {io.ExportMap.Length} falls outside the file";
                return [];
            }

            string component;
            try
            {
                component = io.ExportsLazy[e].Value.ExportType ?? "";
            }
            catch (Exception error)
            {
                refused = $"export {e} would not name its class: {error.Message}";
                return [];
            }

            for (var at = from; at + 12 < to; at++)
            {
                if (!Held(bytes, at, to, out var key, out var source, out var next)) continue;

                lines.Add(new Line(component, key, source));
                at = next - 1;
            }
        }

        return lines;
    }

    private static bool Held(
        byte[] bytes, int at, int to, out string key, out string source, out int next)
    {
        key = source = "";
        next = at;

        // The namespace, empty on every text the client ships.
        if (!Reads(bytes, ref at, to, out var space) || space.Length > 0) return false;
        if (!Reads(bytes, ref at, to, out key) || !IsKey(key)) return false;
        if (!Reads(bytes, ref at, to, out source) || source.Length == 0) return false;

        next = at;
        return true;
    }

    // 32 hex digits. Anchoring on the key rather than on the shape of three
    // strings is what keeps a run of binary from reading as a text: the loose
    // shape matched inside a champion's ability data and produced a key of
    // control characters.
    private static bool IsKey(string read)
    {
        if (read.Length != KeyLength) return false;

        foreach (var c in read)
        {
            var hex = c is >= '0' and <= '9' or >= 'A' and <= 'F' or >= 'a' and <= 'f';
            if (!hex) return false;
        }
        return true;
    }

    private static bool Reads(byte[] bytes, ref int at, int to, out string read)
    {
        read = "";
        if (at + 4 > to) return false;

        var length = BitConverter.ToInt32(bytes, at);
        at += 4;
        if (length == 0) return true;
        if (length is > Longest or < -Longest) return false;

        var wide = length < 0;
        var count = wide ? -length : length;
        var span = wide ? count * 2 : count;
        if (at + span > to) return false;

        // A length counts the terminator, and the terminator is there.
        var end = at + span;
        if (wide ? BitConverter.ToUInt16(bytes, end - 2) != 0 : bytes[end - 1] != 0) return false;

        read = wide
            ? System.Text.Encoding.Unicode.GetString(bytes, at, span - 2)
            : System.Text.Encoding.UTF8.GetString(bytes, at, span - 1);
        at = end;
        return true;
    }
}
