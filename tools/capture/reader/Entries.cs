using Newtonsoft.Json;

namespace Sft.Capture.Reader;

/// The entries a capture's `inventory.json` names, in one flat list.
///
/// Every reading after the inventory iterates it rather than searching the
/// client again: what a set holds was settled once, and a reading that went
/// looking on its own could disagree with it.
public static class Entries
{
    public sealed record Named(string Id, string Path);

    public static IReadOnlyList<Named> From(string inventory)
    {
        var families = JsonConvert
            .DeserializeObject<Dictionary<string, List<Named>>>(File.ReadAllText(inventory))
            ?? throw new InvalidDataException($"{inventory} names no family at all");

        var named = new List<Named>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var entry in families.Values.SelectMany(entries => entries))
        {
            // One entry can stand in two families — the charms table names traits
            // and augments beside its charms — and it is read once.
            if (seen.Add(entry.Id)) named.Add(entry);
        }

        named.Sort((a, b) => string.CompareOrdinal(a.Id, b.Id));
        return named;
    }
}
