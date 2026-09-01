using CUE4Parse.UE4.Assets;

namespace Sft.Capture.Reader;

/// Reading inside an export without a property schema.
///
/// Two things make it possible. The payload of a package begins where its
/// exports end — the file's length less what the export map says they occupy —
/// and the library places it nine bytes early on this build, which is why it is
/// computed here rather than asked for. And the export map gives every export
/// its own range, so what is found in one belongs to the class of that one.
public static class Packed
{
    private const int Longest = 8192;

    // The file ends with two bytes past its last export, so the exports begin
    // that much earlier than their total length alone would put them. Measured
    // on `DA_18_Ahri`, where the identifier component is 21 bytes and its string
    // starts at the export's first byte: the base that puts it there is two
    // below the one the sizes give.
    private const int Trailer = 2;

    public sealed record Export(string Component, int From, int To);

    /// Where a package's export data begins.
    public static long Base(IoPackage io, int length) =>
        length - io.ExportMap.Sum(e => (long) e.CookedSerialSize) - Trailer;

    public static IReadOnlyList<Export>? Exports(
        IoPackage io, int length, out string? refused)
    {
        refused = null;
        var payload = Base(io, length);
        if (payload < 0)
        {
            refused = $"the exports leave no payload in {length} bytes";
            return null;
        }

        var exports = new List<Export>(io.ExportMap.Length);
        for (var e = 0; e < io.ExportMap.Length; e++)
        {
            var export = io.ExportMap[e];
            var from = (int) (payload + (long) export.CookedSerialOffset);
            var to = from + (int) export.CookedSerialSize;
            if (from < 0 || to > length)
            {
                refused = $"export {e} of {io.ExportMap.Length} falls outside the file";
                return null;
            }

            string component;
            try
            {
                component = io.ExportsLazy[e].Value.ExportType ?? "";
            }
            catch (Exception error)
            {
                refused = $"export {e} would not name its class: {error.Message}";
                return null;
            }
            exports.Add(new Export(component, from, to));
        }
        return exports;
    }

    /// A length-prefixed string: the count includes the terminator, and a
    /// negative one counts UTF-16 units.
    public static bool Reads(byte[] bytes, ref int at, int to, out string read)
    {
        read = "";
        if (at + 4 > to) return false;

        var length = BitConverter.ToInt32(bytes, at);
        at += 4;
        if (length == 0) return true;
        if (length is > Longest or < -Longest) return false;

        var wide = length < 0;
        var span = wide ? -length * 2 : length;
        if (at + span > to) return false;

        var end = at + span;
        if (wide ? BitConverter.ToUInt16(bytes, end - 2) != 0 : bytes[end - 1] != 0) return false;

        read = wide
            ? System.Text.Encoding.Unicode.GetString(bytes, at, span - 2)
            : System.Text.Encoding.UTF8.GetString(bytes, at, span - 1);
        at = end;
        return true;
    }
}
