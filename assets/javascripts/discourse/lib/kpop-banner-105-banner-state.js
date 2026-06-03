import { fireMultipleCannons } from "./kpop-banner-105-confetti.js";
import { createKpopBanner105Storage } from "./kpop-banner-105-storage.js";
import { kpoppingPeriodOptions } from "./kpop-banner-105-chart-model.js";
import { getKpopBannerSetting } from "./kpop-banner-105-data-endpoints.js";

const bannerStorage = createKpopBanner105Storage({ kpoppingPeriodOptions });

export function getStoredSource() {
	return bannerStorage.getStoredSource();
}

export function setStoredSource(source) {
	bannerStorage.setStoredSource(source);
}

export function getStoredPeriod() {
	return bannerStorage.getStoredPeriod();
}

export function setStoredPeriod(period) {
	bannerStorage.setStoredPeriod(period);
}

export function setBannerStorageScope(userId) {
	bannerStorage.setBannerStorageScope(userId);
}

export function getReappearMinutes() {
	const raw = Number(getKpopBannerSetting("kpop_banner_reappear_minutes", 60));
	if (!Number.isFinite(raw) || raw <= 0) {
		return 60;
	}
	return Math.floor(raw);
}

export function isBannerHiddenNow() {
	const hiddenUntil = bannerStorage.getHiddenUntil();
	if (!hiddenUntil) {
		return false;
	}
	if (Date.now() >= hiddenUntil) {
		bannerStorage.clearHiddenUntil();
		return false;
	}
	return true;
}

export function setHiddenUntil(timestamp) {
	bannerStorage.setHiddenUntil(timestamp);
}

export function songIdentity(song) {
	return `${song?.detailUrl || ""}|${song?.title || ""}|${song?.artist || ""}`;
}

function readLikeCelebrationState() {
	return bannerStorage.readLikeCelebrationState();
}

function writeLikeCelebrationState(state) {
	bannerStorage.writeLikeCelebrationState(state);
}

function topSongFor(songsBySource, key = "") {
	const songs = [
		...(songsBySource["ichart-day"] || []),
		...(songsBySource["ichart-week"] || []),
	];
	return songs.find((song) => {
		if (key) {
			return songIdentity(song) === key;
		}
		return Number(song?.rank) === 1;
	}) || null;
}

export function createKpopBanner105LikeState({ getSongsBySource }) {
	function isSongLiked(song) {
		const state = readLikeCelebrationState();
		return !!state[songIdentity(song)]?.liked;
	}

	function setSongLiked(song, liked) {
		const state = readLikeCelebrationState();
		const key = songIdentity(song);
		const current = state[key] || {
			activeTopRun: false,
			celebrated: false,
			liked: false,
		};
		current.liked = liked;
		if (!liked) {
			current.celebrated = false;
		}
		state[key] = current;
		writeLikeCelebrationState(state);
	}

	function syncTopRunState(song) {
		const state = readLikeCelebrationState();
		const key = songIdentity(song);
		Object.keys(state).forEach((songKey) => {
			if (songKey !== key && state[songKey]?.activeTopRun) {
				state[songKey].activeTopRun = false;
				state[songKey].celebrated = false;
			}
		});

		if (!song || song.chartFamily || Number(song.rank) !== 1) {
			writeLikeCelebrationState(state);
			return;
		}

		const current = state[key] || {
			activeTopRun: false,
			celebrated: false,
			liked: false,
		};
		current.activeTopRun = true;
		state[key] = current;
		writeLikeCelebrationState(state);
	}

	function shouldCelebrateOnUserLike(song) {
		if (!song || song.chartFamily || Number(song.rank) !== 1) {
			return false;
		}

		const state = readLikeCelebrationState();
		const key = songIdentity(song);
		const current = state[key] || {
			activeTopRun: false,
			celebrated: false,
			liked: false,
		};
		if (!current.liked) {
			state[key] = current;
			writeLikeCelebrationState(state);
			return false;
		}
		if (!current.activeTopRun) {
			current.activeTopRun = true;
			current.celebrated = false;
		}
		if (current.celebrated) {
			state[key] = current;
			writeLikeCelebrationState(state);
			return false;
		}
		current.celebrated = true;
		state[key] = current;
		writeLikeCelebrationState(state);
		return true;
	}

	function maybeCelebrateOnTopSongChange(instance) {
		const nextTopSong = topSongFor(getSongsBySource());
		const nextTopKey = nextTopSong ? songIdentity(nextTopSong) : "";
		if (!instance || !nextTopKey || nextTopKey === instance.lastRenderedSongKey) {
			return;
		}
		instance.lastRenderedSongKey = nextTopKey;
		if (!shouldCelebrateOnUserLike(nextTopSong)) {
			return;
		}

		fireMultipleCannons([
			"#f472b6",
			"#60a5fa",
			"#4ade80",
			"#fb7185",
			"#c084fc",
			"#fcd34d",
			"#ffffff",
		]);
	}

	function updateLikeButtonState(button, song) {
		if (!(button instanceof HTMLElement)) {
			return;
		}
		const activeButton = button.id
			? button.ownerDocument?.getElementById(button.id) || button
			: button;
		if (!(activeButton instanceof HTMLElement)) {
			return;
		}
		const liked = isSongLiked(song);
		activeButton.classList.toggle("is-liked", liked);
		activeButton.dataset.liked = liked ? "1" : "0";
		activeButton.setAttribute("aria-pressed", liked ? "true" : "false");
		activeButton.setAttribute("aria-label", liked ? "取消点赞" : "点赞");
		activeButton.setAttribute("title", liked ? "取消点赞" : "点赞");
		const icon = activeButton.querySelector(".kpop-celebration__like-icon");
		if (icon instanceof HTMLElement) {
			icon.textContent = liked ? "♥" : "♡";
		}
	}

	return {
		isSongLiked,
		setSongLiked,
		syncTopRunState,
		shouldCelebrateOnUserLike,
		maybeCelebrateOnTopSongChange,
		updateLikeButtonState,
	};
}
