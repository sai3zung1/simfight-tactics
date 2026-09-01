using System.Text.RegularExpressions;
using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Assets;

namespace Sft.Capture.Reader;

/// What a set holds, read from the set's own tables.
///
/// A folder is a place and a table is the roster, and the two disagree: the set
/// has 66 champion folders against the 65 the shop sells and 31 more it never
/// does, and three folders no table names at all. So the walk starts at
/// `DA_SetData_Standard&lt;set&gt;`, takes the tables it imports, and follows each
/// table into the tables it imports in turn. Nothing here reads inside an
/// object, so nothing here waits on a property schema.
public static class Inventory
{
    public sealed record Entry(string Id, string Kind, string Path, int? Cost);

    // A table is a table because it carries `TFTDataTable`, never because of what
    // it is called: `DA_18_NoShopChampions` holds 31 champions and the word
    // Table appears nowhere in it.
    private const string DataTable = "TFTDataTable";

    // The family is the only thing read off a name, and only off the tables the
    // set names directly: `DA_18_TraitsTable` is the Traits family and
    // `DA_18_CharmsTable_Standard` the Charms one.
    private static readonly Regex Family =
        new(@"^(?:DA|DT)_\d+_(\w+?)Table", RegexOptions.Compiled);

    // A champion's cost is the table that holds it. The no-shop table matches
    // nothing here, and its champions carry no cost.
    private static readonly Regex CostTable =
        new(@"^DA_\d+_(\d)CostChampions$", RegexOptions.Compiled);

    // What an entry is, in the client's own words: a trait carries `TFTTraitData`,
    // a charm `TFTCharmData`, an item `TFTItemData`. A curve table, a filter and
    // a blueprint carry none, which is what makes them not entries — the same
    // rule as the curve tables, where the name was never what an asset is. The
    // family cannot be derived from it: the Characters table holds
    // `TFTArmoryKeyData`, so the family is the table's name and the kind is the
    // entry's, and the capture keeps both rather than choosing.
    private static readonly Regex Kind =
        new(@"^TFT\w+Data$", RegexOptions.Compiled);

    public static IReadOnlyDictionary<string, IReadOnlyList<Entry>> Read(
        AbstractFileProvider provider, string set, out IReadOnlyList<Refusal> refused)
    {
        var refusals = new List<Refusal>();
        refused = refusals;

        var index = Entries.Index(provider);
        var setData = Find(provider, $"DA_SetData_Standard{set}")
            ?? throw new FileNotFoundException(
                $"no DA_SetData_Standard{set} here, so this client does not hold set {set}");

        var families = new Dictionary<string, IReadOnlyList<Entry>>(StringComparer.Ordinal);
        foreach (var (id, table) in Imports(provider.LoadPackage(setData), refusals, setData))
        {
            if (table is null || !Holds(table, DataTable)) continue;

            var named = Family.Match(id);
            if (!named.Success)
            {
                refusals.Add(new Refusal(id, "is a table the set names and nothing names a family for"));
                continue;
            }

            var entries = new Dictionary<string, Entry>(StringComparer.Ordinal);
            Gather(table, id, null, index, entries, refusals, new HashSet<string>(StringComparer.Ordinal));

            if (entries.Count == 0)
            {
                // A set with no champions is a reader that no longer fits, not a
                // set, and an empty family downstream reads as content retired.
                throw new InvalidDataException($"{id} named no entry at all");
            }

            families[named.Groups[1].Value] = entries.Values
                .OrderBy(entry => entry.Id, StringComparer.Ordinal)
                .ToList();
        }

        return families;
    }

    private static void Gather(
        IPackage table,
        string of,
        int? cost,
        IReadOnlyDictionary<string, string> index,
        Dictionary<string, Entry> entries,
        List<Refusal> refusals,
        HashSet<string> walked)
    {
        if (!walked.Add(of)) return;

        foreach (var (id, imported) in Imports(table, refusals, of))
        {
            if (imported is null) continue;

            if (Holds(imported, DataTable))
            {
                var priced = CostTable.Match(id);
                Gather(
                    imported,
                    id,
                    priced.Success ? int.Parse(priced.Groups[1].Value) : cost,
                    index, entries, refusals, walked);
                continue;
            }

            var kinds = Kinds(imported);
            if (kinds.Count == 0) continue;
            if (kinds.Count > 1)
            {
                refusals.Add(new Refusal(id, $"carries {kinds.Count} kinds: {string.Join(", ", kinds)}"));
                continue;
            }
            if (imported.Name is not { } name || !index.TryGetValue(name, out var path))
            {
                refusals.Add(new Refusal(id, $"named by {of}, and no file carries it"));
                continue;
            }

            if (entries.TryGetValue(id, out var already))
            {
                if (already.Cost != cost)
                {
                    // Taking the first would make a cost depend on the order the
                    // tables happened to be walked in.
                    throw new InvalidDataException(
                        $"{id} is priced {already.Cost?.ToString() ?? "at nothing"} and {cost?.ToString() ?? "at nothing"}");
                }
                continue;
            }
            entries[id] = new Entry(id, kinds[0], path, cost);
        }
    }

    private static bool Holds(IPackage package, string type)
    {
        if (package is not IoPackage io) return false;

        foreach (var export in io.ExportsLazy)
        {
            if (export.Value.ExportType == type) return true;
        }
        return false;
    }

    private static IReadOnlyList<string> Kinds(IPackage package)
    {
        if (package is not IoPackage io) return [];

        var kinds = new List<string>();
        foreach (var export in io.ExportsLazy)
        {
            if (export.Value.ExportType is { } type && Kind.IsMatch(type) && !kinds.Contains(type))
            {
                kinds.Add(type);
            }
        }
        return kinds;
    }

    private static IEnumerable<(string Id, IPackage? Package)> Imports(
        IPackage package, List<Refusal> refusals, string of)
    {
        if (package is not IoPackage io) yield break;

        foreach (var imported in io.ImportedPackages.Value)
        {
            if (imported?.Name is not { } name)
            {
                refusals.Add(new Refusal(of, "names a package that would not open"));
                continue;
            }
            yield return (name[(name.LastIndexOf('/') + 1)..], imported);
        }
    }

    private static string? Find(AbstractFileProvider provider, string name)
    {
        var tail = $"/{name}.uasset";
        return provider.Files.Keys
            .Where(key => key.EndsWith(tail, StringComparison.OrdinalIgnoreCase))
            .OrderBy(key => key, StringComparer.Ordinal)
            .FirstOrDefault();
    }

}
