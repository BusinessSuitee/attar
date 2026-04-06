using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Alatar.Domain.Products;

public sealed record LocalizedProductOption(string Key, string LabelEn, string LabelAr);

public static class ProductOptionJson
{
    private static readonly Regex LegacyArabicPattern = new(
        @"^(?<en>.+?)\s*\((?<ar>[\u0600-\u06FF\s\p{P}]+)\)\s*$",
        RegexOptions.Compiled);

    public static IReadOnlyCollection<string> DeserializeLegacy(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return [];
        }

        try
        {
            return (JsonSerializer.Deserialize<string[]>(value) ?? [])
                .Select(item => item.Trim())
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }
        catch
        {
            return [];
        }
    }

    public static IReadOnlyCollection<LocalizedProductOption> DeserializeLocalized(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return [];
        }

        try
        {
            var localized = JsonSerializer.Deserialize<LocalizedProductOption[]>(value);
            if (localized is not null)
            {
                return Normalize(localized, []);
            }

            return [];
        }
        catch
        {
            try
            {
                var legacy = JsonSerializer.Deserialize<string[]>(value) ?? [];
                return Normalize([], legacy);
            }
            catch
            {
                return [];
            }
        }
    }

    public static string SerializeLegacy(IReadOnlyCollection<string>? values)
    {
        if (values is null || values.Count == 0)
        {
            return "[]";
        }

        var normalized = values
            .Select(item => item.Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return JsonSerializer.Serialize(normalized);
    }

    public static string SerializeLocalized(IReadOnlyCollection<LocalizedProductOption>? values)
    {
        var normalized = Normalize(values, []);
        if (normalized.Count == 0)
        {
            return "[]";
        }

        return JsonSerializer.Serialize(normalized);
    }

    public static IReadOnlyCollection<string> ToLegacyValues(IReadOnlyCollection<LocalizedProductOption>? localizedValues)
    {
        if (localizedValues is null || localizedValues.Count == 0)
        {
            return [];
        }

        return localizedValues
            .Select(option => string.IsNullOrWhiteSpace(option.LabelEn) ? option.LabelAr : option.LabelEn)
            .Select(label => label.Trim())
            .Where(label => !string.IsNullOrWhiteSpace(label))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public static IReadOnlyCollection<LocalizedProductOption> Normalize(
        IReadOnlyCollection<LocalizedProductOption>? localizedValues,
        IReadOnlyCollection<string>? legacyValues,
        bool appendLegacyWhenLocalizedExists = true)
    {
        var result = new List<LocalizedProductOption>();
        var usedKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var usedLabelPairs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var option in localizedValues ?? [])
        {
            var normalized = NormalizeOption(option.Key, option.LabelEn, option.LabelAr, usedKeys, result.Count + 1);
            if (normalized is null)
            {
                continue;
            }

            var labelPair = BuildLabelPair(normalized.LabelEn, normalized.LabelAr);
            if (!usedLabelPairs.Add(labelPair))
            {
                continue;
            }

            result.Add(normalized);
        }

        var shouldAppendLegacy = appendLegacyWhenLocalizedExists || result.Count == 0;
        if (!shouldAppendLegacy)
        {
            return result;
        }

        foreach (var legacy in legacyValues ?? [])
        {
            if (string.IsNullOrWhiteSpace(legacy))
            {
                continue;
            }

            var (labelEn, labelAr) = ParseLegacyLabel(legacy);
            var normalized = NormalizeOption(string.Empty, labelEn, labelAr, usedKeys, result.Count + 1);
            if (normalized is null)
            {
                continue;
            }

            var labelPair = BuildLabelPair(normalized.LabelEn, normalized.LabelAr);
            if (!usedLabelPairs.Add(labelPair))
            {
                continue;
            }

            result.Add(normalized);
        }

        return result;
    }

    private static LocalizedProductOption? NormalizeOption(
        string? key,
        string? labelEn,
        string? labelAr,
        HashSet<string> usedKeys,
        int index)
    {
        var normalizedEn = labelEn?.Trim() ?? string.Empty;
        var normalizedAr = labelAr?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(normalizedEn) && string.IsNullOrWhiteSpace(normalizedAr))
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(normalizedEn))
        {
            normalizedEn = normalizedAr;
        }

        if (string.IsNullOrWhiteSpace(normalizedAr))
        {
            normalizedAr = normalizedEn;
        }

        var keyCandidate = string.IsNullOrWhiteSpace(key)
            ? (string.IsNullOrWhiteSpace(normalizedEn) ? normalizedAr : normalizedEn)
            : key.Trim();

        var normalizedKey = Slugify(keyCandidate);

        if (string.IsNullOrWhiteSpace(normalizedKey))
        {
            normalizedKey = $"option-{index}";
        }

        normalizedKey = EnsureUniqueKey(normalizedKey, usedKeys);

        return new LocalizedProductOption(normalizedKey, normalizedEn, normalizedAr);
    }

    private static (string LabelEn, string LabelAr) ParseLegacyLabel(string value)
    {
        var normalized = value.Trim();
        var match = LegacyArabicPattern.Match(normalized);

        if (!match.Success)
        {
            return (normalized, normalized);
        }

        var labelEn = match.Groups["en"].Value.Trim();
        var labelAr = match.Groups["ar"].Value.Trim();

        if (string.IsNullOrWhiteSpace(labelEn) || string.IsNullOrWhiteSpace(labelAr))
        {
            return (normalized, normalized);
        }

        return (labelEn, labelAr);
    }

    private static string Slugify(string value)
    {
        var chars = new StringBuilder(value.Length);
        var previousWasSeparator = false;

        foreach (var character in value.Trim().ToLowerInvariant())
        {
            if (char.IsLetterOrDigit(character))
            {
                chars.Append(character);
                previousWasSeparator = false;
                continue;
            }

            if (previousWasSeparator)
            {
                continue;
            }

            chars.Append('-');
            previousWasSeparator = true;
        }

        return chars.ToString().Trim('-');
    }

    private static string EnsureUniqueKey(string key, HashSet<string> usedKeys)
    {
        if (usedKeys.Add(key))
        {
            return key;
        }

        var suffix = 2;
        while (!usedKeys.Add($"{key}-{suffix}"))
        {
            suffix++;
        }

        return $"{key}-{suffix}";
    }

    private static string BuildLabelPair(string labelEn, string labelAr)
    {
        return $"{labelEn.Trim()}\u001f{labelAr.Trim()}";
    }
}