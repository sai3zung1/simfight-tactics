using System.Globalization;
using CUE4Parse.Compression;
using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Versions;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Sft.Capture.Reader;

const string usage =
    "usage: reader <paks> [curve-tables <output directory> | inventory <set> | text <inventory file> | identifiers <inventory file>]";

if (args.Length is 0 or 2 or > 3)
{
    Console.Error.WriteLine(usage);
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

    return args[1] switch
    {
        "curve-tables" => WriteCurveTables(provider, args[2]),
        "inventory" => PrintInventory(provider, args[2]),
        "text" => PrintText(provider, args[2]),
        "identifiers" => PrintIdentifiers(provider, args[2]),
        _ => Refuse(),
    };

    int Refuse()
    {
        Console.Error.WriteLine(usage);
        return 2;
    }
}
catch (Exception error)
{
    Console.Error.WriteLine(error.Message);
    return 1;
}

static int WriteCurveTables(AbstractFileProvider provider, string output)
{
    // The name reads against the asset's own file name and keeps its case: a
    // path-wide, case-blind match turns `CT_` into every texture whose name
    // happens to hold "impact_". It narrows; the class decides.
    var matches = provider.Files.Keys
        .Where(path => Path.GetFileName(path).Contains("CT_", StringComparison.Ordinal)
                    && path.EndsWith(".uasset", StringComparison.OrdinalIgnoreCase))
        .OrderBy(path => path, StringComparer.Ordinal);

    Directory.CreateDirectory(output);

    int written = 0, refused = 0;
    foreach (var path in matches)
    {
        // An asset the name caught and that holds no curve table was never this
        // run's to read, so it is neither written nor refused: counting it
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

static int PrintText(AbstractFileProvider provider, string inventory)
{
    var text = new Dictionary<string, IReadOnlyList<Text.Line>>(StringComparer.Ordinal);
    foreach (var entry in Entries.From(inventory))
    {
        var lines = Text.Read(provider, entry.Path, out var why);
        if (why is not null)
        {
            Console.Error.WriteLine(new Refusal(entry.Id, why).ToString());
            continue;
        }
        if (lines.Count == 0)
        {
            // A nameless entry is a read that failed, not an entry without a name.
            Console.Error.WriteLine(new Refusal(entry.Id, "carries no text at all").ToString());
            continue;
        }
        text[entry.Id] = lines;
    }

    Console.WriteLine(Written(text));
    return 0;
}

static int PrintIdentifiers(AbstractFileProvider provider, string inventory)
{
    var identifiers = new Dictionary<string, string>(StringComparer.Ordinal);
    var stated = new Dictionary<string, string>(StringComparer.Ordinal);

    foreach (var entry in Entries.From(inventory))
    {
        var read = Identifier.Read(provider, entry.Path, out var why);
        if (read is null)
        {
            // No entry gets a blank or a derived identifier: the ticket exists
            // because a derived key does not join, and a derived one joins wrongly.
            // An entry carrying no component states nothing, and stating nothing
            // is not a failure to read.
            if (why is not null) Console.Error.WriteLine(new Refusal(entry.Id, why).ToString());
            continue;
        }
        if (stated.TryGetValue(read, out var already))
        {
            // A join key that repeats joins the wrong rows.
            Console.Error.WriteLine($"{entry.Id} and {already} both state {read}");
            return 1;
        }
        stated[read] = entry.Id;
        identifiers[entry.Id] = read;
    }

    Console.WriteLine(Written(identifiers));
    return 0;
}

static string Written(object value) =>
    // Written the way the rest of a capture is written: lower camel keys, and a
    // value that is absent rather than null.
    JsonConvert.SerializeObject(value, Formatting.Indented,
        new JsonSerializerSettings
        {
            // Property names are ours and read as camel case; a dictionary key is
            // the client's own word for a family or an entry, and ADR 0009 keeps it.
            ContractResolver = new CamelCasePropertyNamesContractResolver
            {
                NamingStrategy = { ProcessDictionaryKeys = false },
            },
            NullValueHandling = NullValueHandling.Ignore,
            // Riot writes a bullet as a bare 0x07 inside a description, and the
            // default escaping leaves it raw, which is not JSON any reader will
            // parse. Escaping everything outside plain ASCII keeps the byte and
            // keeps the file readable.
            StringEscapeHandling = StringEscapeHandling.EscapeNonAscii,
        });

static int PrintInventory(AbstractFileProvider provider, string set)
{
    var families = Inventory.Read(provider, set, out var refused);
    foreach (var refusal in refused) Console.Error.WriteLine(refusal.ToString());

    Console.WriteLine(Written(families));
    return 0;
}
