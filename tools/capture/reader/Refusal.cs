namespace Sft.Capture.Reader;

/// One thing the reader would not read, and the check that stopped it.
///
/// The reason is the product, not the count: it is what later says whether the
/// asset changed or the decoder is wrong about it. A refusal with no reason is a
/// guess about why, so `Reason` is never empty.
public sealed record Refusal(string Path, string Reason)
{
    public const char Between = '\t';

    public override string ToString() => $"{Path}{Between}{Reason}";
}
