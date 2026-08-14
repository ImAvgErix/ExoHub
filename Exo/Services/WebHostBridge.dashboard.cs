using System.Text.Json;

using System.Text.Json.Serialization;

using Exo.Helpers;

using Exo.Models;

using Exo.ViewModels;

using Microsoft.UI.Dispatching;

using Microsoft.Web.WebView2.Core;



namespace Exo.Services;



/// <summary>

/// JSON-RPC bridge between the React UI (WebView2) and native optimizer services.

/// UI owns pixels; this host owns elevation, scripts, and live machine reads.

/// </summary>

public sealed partial class WebHostBridge

{

    private object BuildDiagnosticsSummary()
    {
        var specs = HomeDashboardReader.TryReadSystemSpecs();
        var disk = HomeDashboardReader.TryReadSystemDisk();
        var memory = HomeDashboardReader.TryReadMemory();
        var firmware = BuildFirmwareFindings();

        return new
        {
            ok = true,
            specs = specs is null
                ? null
                : new
                {
                    specs.CpuName,
                    specs.LogicalProcessors,
                    specs.GpuName,
                    specs.TotalRamBytes,
                    specs.RamLabel,
                    specs.OsName
                },
            disk = disk is null
                ? null
                : new { disk.TotalBytes, disk.UsedBytes },
            memory = memory is null
                ? null
                : new { memory.TotalBytes, memory.AvailableBytes },
            firmware
        };
    }

    private object BuildDashboard()

    {

        var vm = new DashboardViewModel(_services);

        // Same eight rows as the React shell, in rail order. Overview used to count five.

        var nvidiaTag = vm.NvidiaStatusTag;

        var amdTag = TagFromNativeDetect("amd");

        var systemTag = TagFromNativeDetect("system");

        var internetTag = InternetDashboardTag(vm.InternetStatusTag);

        var steamTag = vm.SteamStatusTag;

        var discordTag = vm.DiscordStatusTag;

        var braveTag = vm.BraveStatusTag;

        var spotifyTag = TagFromNativeDetect("spotify");

        var modules = new[]

        {

            Row("nvidia", "NVIDIA", nvidiaTag),

            Row("amd", "AMD", amdTag),

            Row("system", "Windows", systemTag),

            Row("internet", "Internet", internetTag),

            Row("steam", "Steam", steamTag),

            Row("discord", "Discord", discordTag),

            Row("spotify", "Spotify", spotifyTag),

            Row("brave", "Brave", braveTag),

        };

        var appliedCount = 0;

        foreach (var tag in new[] { nvidiaTag, amdTag, systemTag, internetTag, steamTag, discordTag, braveTag, spotifyTag })

        {

            if (string.Equals(tag, "VERIFIED", StringComparison.OrdinalIgnoreCase)

                || string.Equals(tag, "APPLIED", StringComparison.OrdinalIgnoreCase))

                appliedCount++;

        }

        var total = modules.Length;

        string? nextId = null;

        string? nextLabel = null;

        foreach (var row in new (string Id, string Label, string Tag)[]

        {

            ("nvidia", "NVIDIA", nvidiaTag),

            ("amd", "AMD", amdTag),

            ("system", "Windows", systemTag),

            ("internet", "Internet", internetTag),

            ("steam", "Steam", steamTag),

            ("discord", "Discord", discordTag),

            ("spotify", "Spotify", spotifyTag),

            ("brave", "Brave", braveTag),

        })

        {

            var state = RowState(row.Tag);

            if (state is "applied" or "missing") continue;

            nextId = row.Id;

            nextLabel = row.Label;

            break;

        }

        object? next = nextId is null ? null : new { id = nextId, label = nextLabel };



        return new

        {

            overview = $"{appliedCount} / {total} applied",

            heroSummary = appliedCount >= total

                ? "All optimizers applied"

                : nextLabel is not null

                    ? $"Next: {nextLabel}"

                    : $"{appliedCount}/{total} applied",

            specs = new

            {

                cpu = vm.SpecsCpu,

                gpu = vm.SpecsGpu,

                ram = vm.SpecsRam,

                os = vm.SpecsOs

            },

            // Prefer lightweight live snapshot so home meters never depend on a

            // second full DashboardViewModel construct (detect + seed).

            live = BuildLiveSnapshot(),

            modules,

            // Firmware-level findings Exo can measure but not set. Surfaced here rather than

            // hidden because XMP/EXPO off and Resizable BAR off are the two largest common

            // losses on a gaming PC, and a tool that skips what it cannot fix is hiding the

            // things that would help most.

            firmware = BuildFirmwareFindings(),

            next

        };

    }

    /// <summary>
    /// Home must not green Internet from network-optimizer.json alone. A fresh probe
    /// cache plus MatchesPreset is the same bar as module detect.
    /// </summary>
    private string InternetDashboardTag(string vmTag)
    {
        try
        {
            if (_internetProbeCache is not null
                && DateTimeOffset.UtcNow - _internetProbeCacheUtc < InternetProbeFreshness)
            {
                var saved = _internetProbeCache.ActivePreset;
                if (saved is NetworkPreset.LowestLatency or NetworkPreset.HighestThroughput
                    && _services.Network.MatchesPreset(_internetProbeCache, saved))
                    return "VERIFIED";
            }
        }
        catch
        {
            /* keep the cheap tile tag */
        }

        return vmTag;
    }



    private static object[] BuildFirmwareFindings()

    {

        try

        {

            return FirmwareAdvisor.Scan()

                .Select(f => (object)new

                {

                    id = f.Id,

                    title = f.Title,

                    // null = could not read. Kept distinct from false so the UI never shows

                    // "unknown" as a failure or as a pass.

                    ok = f.Ok,

                    detail = f.Detail,

                    fixWhere = f.FixWhere

                })

                .ToArray();

        }

        catch

        {

            return Array.Empty<object>();

        }

    }



    /// <summary>

    /// Lightweight live tick — never construct DashboardViewModel (that runs full

    /// detect/seed and starves the UI every ~1s, emptying meter cards).

    /// </summary>

    private object BuildLive() => BuildLiveSnapshot();



    private object BuildLiveSnapshot()

    {

        var mem = HomeDashboardReader.TryReadMemory();

        double memPct = 0;

        var used = "—";

        var total = "—";

        var memSecondary = "—";

        if (mem is not null)

        {

            memPct = mem.LoadPercent;

            var usedB = mem.TotalBytes > mem.AvailableBytes ? mem.TotalBytes - mem.AvailableBytes : 0UL;

            used = HomeDashboardReader.FormatBytes(usedB);

            total = HomeDashboardReader.FormatBytes(mem.TotalBytes);

            memSecondary = $"{used} / {total}";

        }



        var cpu = HomeDashboardReader.TryReadCpuLoadPercent();

        var gpu = HomeDashboardReader.TryReadGpuLoadPercent();



        // The DISK cell reads the system drive. Reported in the same shape as memory so the

        // telemetry band can render all four cells from one rule.

        var disk = HomeDashboardReader.TryReadSystemDisk();

        var diskUsed = disk is null ? "—" : HomeDashboardReader.FormatBytes(disk.UsedBytes);

        var diskTotal = disk is null ? "—" : HomeDashboardReader.FormatBytes(disk.TotalBytes);



        var link = HomeDashboardReader.TryReadPrimaryLinkSpeed();

        var netLinkSpeed = link is not null && link.BitsPerSecond > 0 ? link.Label : "—";

        var netLinkMedia = link is not null && link.BitsPerSecond > 0 ? link.MediaKind : "No link";

        var netLink = link is not null && link.BitsPerSecond > 0

            ? $"{link.Label} {link.MediaKind}"

            : "No link";



        var quality = _services.Network.LoadQualityBenchmark();

        double? idleMs = null;

        double? down = null, up = null, loadedDown = null, loadedUp = null, loss = null;

        string? dns = null;

        var hasQuality = false;

        if (quality is { Ok: true, IsQualityTest: true })

        {

            hasQuality = true;

            idleMs = quality.PingP50Ms;

            if (quality.DownloadMbps > 0) down = Math.Round(quality.DownloadMbps, 0);

            if (quality.UploadMbps > 0) up = Math.Round(quality.UploadMbps, 0);

            // Absolute loaded path latency (not only delta) for clear cards.

            if (quality.DownloadLoadedMs > 0)

                loadedDown = Math.Round(quality.DownloadLoadedMs, 1);

            if (quality.UploadLoadedMs > 0)

                loadedUp = Math.Round(quality.UploadLoadedMs, 1);

            loss = quality.PacketLossPercent;

            if (!string.IsNullOrWhiteSpace(quality.DnsProvider))

                dns = quality.DnsProvider;

        }

        else

        {

            var latency = HomeDashboardReader.TryReadLatency(_services.Network);

            if (latency is not null)

                idleMs = latency.AfterP50Ms;

            dns ??= HomeDashboardReader.TryReadInternetDnsStatus();

        }



        var idleLabel = idleMs is not null ? $"{idleMs.Value:0.#} ms" : "—";

        var (rating, ratingDetail) = RateNetwork(idleMs, loss, loadedDown, loadedUp, hasQuality);



        return new

        {

            memoryPercent = memPct,

            memoryUsed = used,

            memoryTotal = total,

            memorySecondary = memSecondary,

            cpuPercent = cpu is null ? 0 : Math.Round(cpu.Value, 0),

            hasCpu = cpu is not null,

            gpuPercent = gpu is null ? 0 : Math.Round(gpu.Value, 0),

            hasGpu = gpu is not null,

            diskPercent = disk?.LoadPercent ?? 0,

            hasDisk = disk is not null,

            diskUsed,

            diskTotal,

            diskSecondary = disk is null ? "—" : $"{diskUsed} of {diskTotal}",

            netLink,

            netLinkSpeed,

            netLinkMedia,

            netIdleMs = idleLabel,

            netIdleMsValue = idleMs ?? 0,

            netDownMbps = down,

            netUpMbps = up,

            netLoadedDownMs = loadedDown,

            netLoadedUpMs = loadedUp,

            netLoss = loss is null ? null : $"{loss:0.##}%",

            netLossPercent = loss,

            netDns = dns,

            netRating = rating,

            netRatingDetail = ratingDetail,

            // Kept for older UI; no longer mapped to a fake “health” bar.

            netMetricPercent = 0

        };

    }



    /// <summary>Simple honest grade from last quality sample (or idle-only).</summary>

    private static (string Rating, string Detail) RateNetwork(

        double? idleMs,

        double? lossPercent,

        double? loadedDownMs,

        double? loadedUpMs,

        bool hasQuality)

    {

        if (idleMs is null && !hasQuality)

            return ("—", "Run Internet → Apply for a full quality sample.");



        var score = 100.0;

        var notes = new List<string>();



        if (idleMs is double idle)

        {

            if (idle <= 15) { /* excellent */ }

            else if (idle <= 30) { score -= 10; notes.Add("idle latency ok"); }

            else if (idle <= 50) { score -= 25; notes.Add("idle latency elevated"); }

            else if (idle <= 80) { score -= 40; notes.Add("idle latency high"); }

            else { score -= 55; notes.Add("idle latency poor"); }

        }



        if (lossPercent is double loss)

        {

            if (loss <= 0.1) { /* clean */ }

            else if (loss <= 1) { score -= 15; notes.Add("light packet loss"); }

            else if (loss <= 3) { score -= 30; notes.Add("packet loss"); }

            else { score -= 50; notes.Add("heavy packet loss"); }

        }



        if (loadedDownMs is double ld && idleMs is double idle2 && idle2 > 0)

        {

            var inflate = ld / Math.Max(1, idle2);

            if (inflate > 4) score -= 20;

            else if (inflate > 2.5) score -= 10;

        }

        if (loadedUpMs is double lu && idleMs is double idle3 && idle3 > 0)

        {

            var inflate = lu / Math.Max(1, idle3);

            if (inflate > 4) score -= 15;

            else if (inflate > 2.5) score -= 8;

        }



        if (!hasQuality)

            score = Math.Min(score, 75);



        score = Math.Clamp(score, 0, 100);

        var rating = score >= 85 ? "Excellent"

            : score >= 70 ? "Good"

            : score >= 50 ? "Fair"

            : "Poor";

        // Keep detail empty — home card shows rating grade only (no prose notes).

        return (rating, "");

    }



    /// <summary>Public tip jar — free app; optional support.</summary>

    public const string BuyMeACoffeeUrl = "https://www.buymeacoffee.com/UhhErix";

    public const string IssuesUrl = "https://github.com/ImAvgErix/ExoHub/issues";



}

