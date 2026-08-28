using CUE4Parse.FileProvider;

namespace Sft.Capture.Reader;

/// A curve table read from the bytes rather than through the object layer.
///
/// The library places an export's payload nine bytes early on this build, so a
/// row count reads as zero and a table comes back empty. The payload in fact
/// begins where the exports end — the file's length less what the export map
/// says they occupy — and from there the shape is fixed: two bytes of header, a
/// row count, a mode, then one row per count. A row is a name into the package's
/// own table, three bytes of curve settings, a key count, and that many pairs of
/// floats.
public static class CurveTable
{
    public sealed record Row(string Name, IReadOnlyDictionary<float, float> Series);

    public static IReadOnlyList<Row>? Read(AbstractFileProvider provider, string path)
    {
        var bytes = provider.SaveAsset(path);
        var package = provider.LoadPackage(path);
        if (package is not CUE4Parse.UE4.Assets.IoPackage io) return null;

        var payload = bytes.Length - io.ExportMap.Sum(e => (long) e.CookedSerialSize);
        if (payload < 0 || payload + 7 > bytes.Length) return null;

        var names = package.NameMap;
        var at = (int) payload + 2;
        var count = BitConverter.ToInt32(bytes, at);
        at += 5; // the row count, then the table's curve mode
        if (count < 0 || count > names.Length) return null;

        var rows = new List<Row>(count);
        for (var r = 0; r < count; r++)
        {
            if (at + 15 > bytes.Length) return null;

            var index = BitConverter.ToInt32(bytes, at);
            if (index < 0 || index >= names.Length) return null;
            at += 8 + 3; // the name and its number, then the curve settings

            var keys = BitConverter.ToInt32(bytes, at);
            at += 4;
            if (keys < 0 || at + keys * 8 > bytes.Length) return null;

            var series = new Dictionary<float, float>(keys);
            for (var k = 0; k < keys; k++)
            {
                series[BitConverter.ToSingle(bytes, at)] = BitConverter.ToSingle(bytes, at + 4);
                at += 8;
            }
            at += 6; // the curve's default value, and the two bytes that close a row

            var name = names[index].Name;
            if (name is null) return null;
            rows.Add(new Row(name, series));
        }

        return rows;
    }
}
