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

    /// Whether the package carries a curve table at all.
    ///
    /// A file name is a cheap way to narrow a quarter of a million files; it is
    /// not what an asset is. 1091 of them are named `CT_` here and only 667 are
    /// curve tables — the rest are colour curves, textures and effect systems,
    /// and reading those wrote 332 empty files and refused 92 more, neither
    /// number saying anything about the client. Of 3000 assets sampled from the
    /// 202 621 the name excludes, none carried a curve table, so the name stays
    /// the pre-filter and this is the decision.
    public static bool Holds(AbstractFileProvider provider, string path)
    {
        if (provider.LoadPackage(path) is not CUE4Parse.UE4.Assets.IoPackage io) return false;

        foreach (var export in io.ExportsLazy)
        {
            if (export.Value.ExportType == "CurveTable") return true;
        }
        return false;
    }

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
