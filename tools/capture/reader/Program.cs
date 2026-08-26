using CUE4Parse.Compression;
using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Versions;
using Newtonsoft.Json;

if (args.Length is 0 or > 3)
{
    Console.Error.WriteLine("usage: reader <paks> [pattern [output directory]]");
    return 2;
}

try
{
    // Every container holding content declares Oodle and no other method, so
    // nothing mounts without a decompressor. The helper fetches one rather than
    // reading the client's own copy, which is linked into its executable and
    // which ADR 0003 forbids redistributing anyway.
    OodleHelper.Initialize(
        Path.Combine(AppContext.BaseDirectory, OodleHelper.OodleFileName));

    var provider = new DefaultFileProvider(
        args[0],
        SearchOption.TopDirectoryOnly,
        new VersionContainer(EGame.GAME_UE5_7),
        StringComparer.OrdinalIgnoreCase);

    provider.Initialize();
    provider.Mount();

    if (provider.Files.Count == 0)
    {
        // A client that opens to nothing is a reader that does not fit, not an
        // empty client.
        Console.Error.WriteLine($"nothing mounted from {args[0]}");
        return 1;
    }

    if (args.Length == 1)
    {
        Console.WriteLine(provider.Files.Count);
        return 0;
    }

    var pattern = args[1];
    // The pattern reads against the asset's own name and keeps its case: a
    // path-wide, case-blind match turns `CT_` into every texture whose name
    // happens to hold "impact_".
    var matches = provider.Files.Keys
        .Where(path => path.EndsWith(".uasset", StringComparison.OrdinalIgnoreCase))
        .Where(path => Path.GetFileName(path).Contains(pattern, StringComparison.Ordinal))
        .OrderBy(path => path, StringComparer.Ordinal)
        .ToList();

    if (args.Length == 2)
    {
        foreach (var path in matches) Console.WriteLine(path);
        return 0;
    }

    var output = args[2];
    Directory.CreateDirectory(output);

    var written = 0;
    foreach (var path in matches)
    {
        // #195 will make a single unreadable asset a refusal of its own. Until
        // it lands, one that cannot be read stops the run — and it says why.
        var package = provider.LoadPackage(path);

        var exports = package.ExportsLazy.Select(export => export.Value).ToArray();
        var name = path
            .Replace('/', '.')
            .Replace(".uasset", string.Empty, StringComparison.OrdinalIgnoreCase);

        File.WriteAllText(
            Path.Combine(output, $"{name}.json"),
            JsonConvert.SerializeObject(exports, Formatting.Indented));
        written++;
    }

    Console.WriteLine(written);
    return 0;
}
catch (Exception error)
{
    Console.Error.WriteLine(error.Message);
    return 1;
}
