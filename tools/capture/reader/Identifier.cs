using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Assets;

namespace Sft.Capture.Reader;

/// The identifier an entry states for itself.
///
/// It is the string in the entry's own `TFTIdentifierDataComponent` —
/// `DA_18_Ahri` — and it is what the client calls the entry, which
/// `docs/adr/0009-riot-naming-is-the-vocabulary.md` makes the vocabulary.
///
/// Riot writes it as the asset's own name on 90 of the 96 champions, and as the
/// canonical `TFT18_Akali` on the six that ship more than one asset. Which of
/// the two a match record returns is unverified: no match record exists here,
/// and the `TFT18_*` names in the client's *paths* are visual effects —
/// `TFT18_Adjacent`, `TFT18_Armory`, `TFT18_Attack1` sit among them — so a path
/// is not a second opinion. #296 is where the two meet.
///
/// Champions, items and traits carry the component on every entry. Augments,
/// encounters and all but ten charms carry none, and that is the client saying
/// nothing rather than a reading that failed.
public static class Identifier
{
    private const string Component = "TFTIdentifierDataComponent";

    /// The identifier, or null. `refused` is set only when the entry carries the
    /// component and nothing could be read out of it — an entry that carries no
    /// component at all states no identifier, which is a fact about the client.
    public static string? Read(
        AbstractFileProvider provider, string path, out string? refused)
    {
        refused = null;
        var bytes = provider.SaveAsset(path);
        if (provider.LoadPackage(path) is not IoPackage io)
        {
            refused = "not an IoStore package";
            return null;
        }

        var exports = Packed.Exports(io, bytes.Length, out refused);
        if (exports is null) return null;

        foreach (var export in exports)
        {
            if (export.Component != Component) continue;

            for (var at = export.From; at + 4 < export.To; at++)
            {
                if (Packed.Reads(bytes, ref at, export.To, out var read) && read.Length > 0)
                {
                    return read;
                }
            }

            refused = $"{Component} holds no identifier";
            return null;
        }

        return null;
    }
}
