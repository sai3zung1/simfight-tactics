using System.Text.RegularExpressions;
using CUE4Parse.FileProvider;

namespace Sft.Capture.Reader;

/// The classification tags an entry carries, in the client's own words.
///
/// This ticket was written to resolve a fingerprint — an item's tags read
/// `{b72bd3bf}` in the published bundle, never a name. The client writes them
/// out: `Item.Equippable.Category.Attack`, `Augment.Tier.Gold`,
/// `Augment.Category.Economic`. The fingerprints belonged to the source
/// `docs/adr/0010-riot-is-the-only-source.md` removed, so the problem left with
/// it and what remains is a reading.
///
/// A tag is a name, so it is in the package's name map and needs no property
/// schema. That also means the map carries more than a classification — a
/// champion's audio and combat tags sit in it too — and the capture keeps them
/// all rather than deciding here which namespace a screen may ever read.
public static class Tags
{
    // Two or more dot-separated segments, the first capitalised. `Augment.Tier.Gold`
    // matches; `DA_18_Ahri` and `1.05` do not.
    private static readonly Regex Shape =
        new(@"^[A-Z][A-Za-z0-9]*(\.[A-Za-z0-9]+)+$", RegexOptions.Compiled);

    public static IReadOnlyList<string> Read(AbstractFileProvider provider, string path)
    {
        var names = provider.LoadPackage(path).NameMap;

        var tags = new SortedSet<string>(StringComparer.Ordinal);
        foreach (var name in names)
        {
            if (name.Name is { } read && Shape.IsMatch(read)) tags.Add(read);
        }
        return tags.ToList();
    }
}
