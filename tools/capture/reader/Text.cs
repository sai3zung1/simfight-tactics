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
    // and so without a property schema.
    private const int KeyLength = 32;

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

        var exports = Packed.Exports(io, bytes.Length, out refused);
        if (exports is null) return [];

        var lines = new List<Line>();
        foreach (var export in exports)
        {
            for (var at = export.From; at + 12 < export.To; at++)
            {
                if (!Held(bytes, at, export.To, out var key, out var source, out var next)) continue;

                lines.Add(new Line(export.Component, key, source));
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
        if (!Packed.Reads(bytes, ref at, to, out var space) || space.Length > 0) return false;
        if (!Packed.Reads(bytes, ref at, to, out key) || !IsKey(key)) return false;
        if (!Packed.Reads(bytes, ref at, to, out source) || source.Length == 0) return false;

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
}
