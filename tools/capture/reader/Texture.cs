using System.Runtime.InteropServices;
using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Assets;
using CUE4Parse_Conversion.Textures.DXT;
using SkiaSharp;

namespace Sft.Capture.Reader;

/// A texture read from the bytes, the way a curve table is.
///
/// The library returns nothing for a texture on this build, because finding the
/// platform data means stepping over a property block whose length only a schema
/// gives. It can be found instead: the pixel format is written out as a string,
/// and the three numbers before it are the size. Measured against the portrait
/// the previous chain produced, the mip begins twelve bytes after that string —
/// decoding from there differs from the file in the tree by 2.19 per channel,
/// and decoding twelve bytes later by 83.
///
/// Thirty-five of the set's textures keep their pixels in a companion `.ubulk`
/// instead, which holds the mip and nothing else — 8192 bytes for a DXT1 at 128
/// by 128, 16384 for a DXT5.
public static class Texture
{
    public sealed record Image(int Width, int Height, string Format, byte[] Png);

    /// One image in a capture's asset index: which entry named it, the file it
    /// was written to, and what it opens at.
    public sealed record Held(string Entry, string File, int Width, int Height, string Format);

    private const string Marks = "PF_";
    private const int BeforeTheMip = 12;

    public static Image? Read(
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
            var at = Marked(bytes, export.From, export.To);
            if (at < 0) continue;

            var length = BitConverter.ToInt32(bytes, at - 4);
            var format = System.Text.Encoding.UTF8.GetString(bytes, at, length - 1);
            var width = BitConverter.ToInt32(bytes, at - 16);
            var height = BitConverter.ToInt32(bytes, at - 12);
            if (width <= 0 || height <= 0 || width % 4 != 0 || height % 4 != 0)
            {
                refused = $"{format} at {width} by {height}, which is not a mip";
                return null;
            }

            // `length` counts the terminator, so the string ends at at + length.
            var from = at + length + BeforeTheMip;
            var need = Sized(format, width, height);
            if (need == 0)
            {
                refused = $"{format} is a format nothing here decodes";
                return null;
            }

            var mip = new byte[need];
            if (from + need <= bytes.Length)
            {
                Array.Copy(bytes, from, mip, 0, need);
            }
            else
            {
                var beside = Bulk(provider, path);
                if (beside is null || beside.Length < need)
                {
                    refused = beside is null
                        ? $"{format} at {width} by {height} wants {need} bytes, the file holds {bytes.Length - from}, and no companion carries the rest"
                        : $"{format} at {width} by {height} wants {need} bytes and its companion holds {beside.Length}";
                    return null;
                }
                Array.Copy(beside, 0, mip, 0, need);
            }
            return new Image(width, height, format, Png(Pixels(format, mip, width, height), width, height));
        }

        return null;
    }

    /// The mip when the asset keeps it beside itself rather than inside itself.
    private static byte[]? Bulk(AbstractFileProvider provider, string path)
    {
        var beside = path[..^".uasset".Length] + ".ubulk";
        return provider.Files.ContainsKey(beside) ? provider.SaveAsset(beside) : null;
    }

    /// Where the pixel format's name begins inside an export, or -1.
    private static int Marked(byte[] bytes, int from, int to)
    {
        for (var at = from + 16; at + Marks.Length < to; at++)
        {
            if (bytes[at] != 'P' || bytes[at + 1] != 'F' || bytes[at + 2] != '_') continue;

            var length = BitConverter.ToInt32(bytes, at - 4);
            if (length > 3 && length < 64 && at + length <= to && bytes[at + length - 1] == 0)
            {
                return at;
            }
        }
        return -1;
    }

    private static int Sized(string format, int width, int height) => format switch
    {
        "PF_DXT1" => width / 4 * (height / 4) * 8,
        "PF_DXT5" => width / 4 * (height / 4) * 16,
        "PF_B8G8R8A8" => width * height * 4,
        _ => 0,
    };

    private static byte[] Pixels(string format, byte[] mip, int width, int height) => format switch
    {
        "PF_DXT1" => DXTDecoder.DXT1(mip, width, height, 1),
        "PF_DXT5" => DXTDecoder.DXT5(mip, width, height, 1),
        // The client stores it blue first; the encoder reads it red first.
        _ => Swapped(mip),
    };

    private static byte[] Swapped(byte[] mip)
    {
        for (var at = 0; at + 2 < mip.Length; at += 4)
        {
            (mip[at], mip[at + 2]) = (mip[at + 2], mip[at]);
        }
        return mip;
    }

    private static byte[] Png(byte[] rgba, int width, int height)
    {
        var info = new SKImageInfo(width, height, SKColorType.Rgba8888, SKAlphaType.Unpremul);
        var pinned = GCHandle.Alloc(rgba, GCHandleType.Pinned);
        try
        {
            using var bitmap = new SKBitmap();
            bitmap.InstallPixels(info, pinned.AddrOfPinnedObject(), info.RowBytes);
            using var image = SKImage.FromBitmap(bitmap);
            using var data = image.Encode(SKEncodedImageFormat.Png, 100);
            return data.ToArray();
        }
        finally
        {
            pinned.Free();
        }
    }
}
