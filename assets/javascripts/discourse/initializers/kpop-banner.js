import { apiInitializer } from "discourse/lib/api";
import {
	configureKpopBanner105,
	mountKpopBanner,
	unmountKpopBanner,
} from "../lib/kpop-banner-105-lifecycle-runtime.js";

export { mountKpopBanner, unmountKpopBanner };

export default apiInitializer("0.8", (api) => {
	configureKpopBanner105(api);
});
