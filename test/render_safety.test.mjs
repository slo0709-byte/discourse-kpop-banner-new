import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCircleModalTableHtml,
  buildIchartModalTableHtml,
  buildMusicShowModalTableHtml,
  buildMusicShowRankModalTableHtml,
} from "../assets/javascripts/discourse/lib/kpop-banner-105-modal-content.js";
import {
  getMicroTrendHtml,
  getPlatformPillsHtml,
} from "../assets/javascripts/discourse/lib/kpop-banner-105-render-utils.js";

const malicious = {
  title: '<script>window.__kpopXss=1</script>',
  artist: 'Artist <img src=x onerror=alert(1)>',
  album: 'javascript:alert(1)',
  showName: '<svg onload=alert(2)>',
  platform: '<b onclick=alert(3)>Melon</b>',
};

function assertEscapedHtml(html) {
	assert.doesNotMatch(html, /<script/i);
	assert.doesNotMatch(html, /<(?:img|iframe|object|a|b)\b/i);
	assert.doesNotMatch(html, /<[^>]+\s(?:onerror|onload|onclick)=/i);
	assert.doesNotMatch(html, /<[^>]+(?:href|src|srcdoc|data)=javascript:/i);
	assert.match(html, /&lt;|&#106;avascript:/i);
}

describe("render safety", () => {
  it("escapes malicious music show modal fields", () => {
    const html = buildMusicShowModalTableHtml({
      title: malicious.title,
      artist: malicious.artist,
      musicShowMeta: {
        showName: malicious.showName,
        episodeNumber: "12",
        airDate: malicious.album,
      },
    });

    assertEscapedHtml(html);
  });

  it("escapes malicious music show ranking arrays", () => {
    const html = buildMusicShowRankModalTableHtml({
      chartLabel: malicious.title,
      musicShowRankMeta: {
        wins: "7",
        showBreakdown: [{ show: malicious.showName, wins: "2" }],
        songs: [malicious.title, malicious.artist],
        winningSongs: malicious.album,
        yearBreakdown: [{ year: malicious.platform, wins: "1" }],
        shows: [malicious.platform],
      },
    });

    assertEscapedHtml(html);
  });

  it("escapes malicious Circle and iChart modal fields", () => {
    const circleHtml = buildCircleModalTableHtml({
      chartFamily: "album",
      circleMeta: {
        album: malicious.album,
        companyDist: malicious.artist,
        companyMake: malicious.title,
        albumCnt: malicious.showName,
        totalCnt: malicious.platform,
        cert: malicious.title,
      },
    });
	const ichartHtml = buildIchartModalTableHtml({
		tableDetails: [
			{
				platform: malicious.platform,
				colorClass: 'color-ichart" onclick="alert(4)',
				rows: [
            {
              name: malicious.title,
              rank: malicious.artist,
              score: malicious.album,
              multi: malicious.showName,
              trend: "up",
              trendVal: malicious.platform,
            },
          ],
        },
      ],
    });

    assertEscapedHtml(circleHtml);
    assertEscapedHtml(ichartHtml);
  });

  it("escapes malicious platform pills and trend labels", () => {
    const html = `${getPlatformPillsHtml([
      {
        class: "safe-class",
        name: malicious.platform,
        rank: malicious.title,
        trend: "up",
        trendVal: malicious.artist,
      },
    ])}${getMicroTrendHtml("down", malicious.showName)}`;

    assertEscapedHtml(html);
  });
});
