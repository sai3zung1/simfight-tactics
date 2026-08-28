using CUE4Parse.MappingsProvider;

namespace Sft.Capture.Reader;

public class WrittenMappings : JsonTypeMappingsProvider
{
    private string _path = string.Empty;
    public WrittenMappings(string path) => Load(path);
    public override void Load(string path, StringComparer? comparer = null)
    { _path = path; AddStructs(File.ReadAllText(path)); }
    public override void Load(byte[] bytes, StringComparer? comparer = null) =>
        AddStructs(System.Text.Encoding.UTF8.GetString(bytes));
    public override void Reload() => Load(_path);
}
