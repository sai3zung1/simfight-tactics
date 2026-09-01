using System.Globalization;
using CUE4Parse.Compression;
using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Versions;
using Newtonsoft.Json;
using Sft.Capture.Reader;

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

    var mappings = Environment.GetEnvironmentVariable("SFT_MAPPINGS");
    if (!string.IsNullOrEmpty(mappings))
    {
        provider.MappingsContainer = new WrittenMappings(mappings);
    }

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

    // The pattern reads against the asset's own name and keeps its case: a
    // path-wide, case-blind match turns `CT_` into every texture whose name
    // happens to hold "impact_".
    var matches = provider.Files.Keys
        .Where(path => Path.GetFileName(path).Contains(args[1], StringComparison.Ordinal))
        .OrderBy(path => path, StringComparer.Ordinal)
        .ToList();

    if (args.Length == 2)
    {
        foreach (var path in matches) Console.WriteLine(path);
        return 0;
    }

    var output = args[2];
    Directory.CreateDirectory(output);

    int written = 0, refused = 0;
    foreach (var path in matches.Where(
        p => p.EndsWith(".uasset", StringComparison.OrdinalIgnoreCase)))
    {
        // An asset the pattern caught and that holds no curve table was never
        // this run's to read, so it is neither written nor refused: counting it
        // either way makes the totals describe the naming rather than the client.
        if (!CurveTable.Holds(provider, path)) continue;

        var rows = CurveTable.Read(provider, path, out var why);
        if (rows is null)
        {
            if (string.IsNullOrEmpty(why))
            {
                // An unnamed refusal is a guess about why, and the count would
                // carry it as though it were a reading.
                Console.Error.WriteLine($"{path} was refused and no check said why");
                return 1;
            }

            // Refusals travel on stderr and counts on stdout. Mixing the two is
            // what made `dotnet run` unusable here: a warning read as a result.
            Console.Error.WriteLine(new Refusal(path, why).ToString());
            refused++;
            continue;
        }

        File.WriteAllText(
            // Named for its whole path: two folders ship a CT_Ascension, and a
            // capture that keeps one of them silently keeps the wrong one.
            Path.Combine(output, path.Replace('/', '.').Replace(".uasset", ".json", StringComparison.OrdinalIgnoreCase)),
            // Sorted on the way out, rows and keys alike: the order an asset
            // happens to carry is the library's, and the chain's own files have
            // to be a function of the client rather than of how it was walked.
            JsonConvert.SerializeObject(
                rows.OrderBy(r => r.Name, StringComparer.Ordinal)
                    .ToDictionary(
                        r => r.Name,
                        r => r.Series
                            .ToDictionary(
                                k => k.Key.ToString(CultureInfo.InvariantCulture),
                                k => k.Value)
                            .OrderBy(k => k.Key, StringComparer.Ordinal)
                            .ToDictionary(k => k.Key, k => k.Value)),
                Formatting.Indented));
        written++;
    }

    Console.WriteLine($"{written} {refused}");
    return 0;
}
catch (Exception error)
{
    Console.Error.WriteLine(error.Message);
    return 1;
}
