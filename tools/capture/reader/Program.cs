using CUE4Parse.Compression;
using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Versions;

if (args.Length != 1)
{
    Console.Error.WriteLine("usage: reader <paks directory>");
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

    Console.WriteLine(provider.Files.Count);
    return 0;
}
catch (Exception error)
{
    Console.Error.WriteLine(error.Message);
    return 1;
}
