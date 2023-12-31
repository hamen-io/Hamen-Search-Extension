/**
 * Writes the user's settings to the local storage; use `readAppearance` to read, and set these changes again.
 */
const writeAppearance = (options = { isDarkMode: true, fontSizeMultiplier: 1, searchEngine: "DUCKDUCKGO" }) => {
    chrome.storage.local.set({ "hamenSearchExtension": {
        settings: {
            appearance: {
                isDarkMode: options.isDarkMode,
                fontSizeMultiplier: options.fontSizeMultiplier,
                searchEngine: options.searchEngine
            }
        }
    } });
};

const readAppearance = () => {
    chrome.storage.local.get("hamenSearchExtension").then((hamenSearchExtension) => {
        const settings = hamenSearchExtension.hamenSearchExtension?.settings;
        document.querySelector("#theme-menu").value = settings?.appearance?.isDarkMode === true ? "DARK" : "LIGHT";
        if (settings?.appearance?.fontSizeMultiplier) document.querySelector("#font-size-multiplier").value = settings.appearance.fontSizeMultiplier.toString();
        document.querySelector("#search-engine").value = settings?.appearance?.searchEngine?.toString()?.toUpperCase() || "DUCKDUCKGO";

        updateAppearance();
    });
};

const updateAppearance = () => {
    const root = document.querySelector(":root");

    const isDarkMode = document.querySelector("#theme-menu").value === "DARK";
    const fontSizeMultiplier = parseFloat(document.querySelector("#font-size-multiplier").value) || 1;
    const searchEngine = document.querySelector("#search-engine").value;
    root.setAttribute("is-dark-mode", isDarkMode);
    root.style.setProperty("--hamen-font-size-multiplier", fontSizeMultiplier);

    writeAppearance({ isDarkMode: isDarkMode, fontSizeMultiplier: fontSizeMultiplier, searchEngine: searchEngine });
};

window.addEventListener("DOMContentLoaded", () => {
    const showSettings = () => {
        document.querySelector("aside#settings-menu").classList.add("toggled");
        document.querySelector("div#body-blocker").classList.add("visible");
        document.querySelector("#toggle-settings>input").checked = true;
    };

    const hideSettings = () => {
        document.querySelector("aside#settings-menu").classList.remove("toggled");
        document.querySelector("div#body-blocker").classList.remove("visible");
        document.querySelector("#toggle-settings>input").checked = false;
    };

    const isSettingsVisible = () => {
        return document.querySelector("aside#settings-menu").classList.contains("toggled");
    }

    window.addEventListener("keydown", e => {
        if (e.key === "Escape" && isSettingsVisible()) {
            hideSettings();
        }
    });

    document.querySelector("#body-blocker").addEventListener("click", e => {
        if (e.target.id === "body-blocker") {
            hideSettings();
        }
    })

    window.addEventListener("scroll", () => { window.scrollTo({ left: 0, top: 0 }); })
    readAppearance();

    Array.from(document.querySelectorAll(".hamburger")).forEach(hamburger => {
        hamburger.querySelector("input").addEventListener("input", function(e) {
            if (this.checked) {
                showSettings();
            } else {
                hideSettings();
            }
        })
    })

    document.querySelector("#theme-menu").addEventListener("input", updateAppearance)
    document.querySelector("#search-engine").addEventListener("input", updateAppearance)
    document.querySelector("#theme-menu").addEventListener("change", function() { if (this.value) { updateAppearance(); } else { this.value = 1;updateAppearance(); } })
    document.querySelector("#font-size-multiplier").addEventListener("input", function(e) {
        const min = 0.1;
        const max = 3;

        if (this.value.trim() === "") {
        } else if (parseFloat(this.value) > max) {
            this.value = max;
            updateAppearance();
        } else if (parseFloat(this.value) < min) {
            this.value = min;
            updateAppearance();
        } else {
            updateAppearance();
        }
    })

    document.querySelector("#font-size-multiplier").addEventListener("blur", function() { if (this.value === "") { this.value = 1; } });

    const searchInput = document.querySelector("#search");
    const searchContainer = document.querySelector(".search");
    let searchResultIndex = -1;
    let searchResults = {
        "Result 1": "",
        "Result 2": "",
        "Result 3": "",
        "Result 4": "",
        "Result 5": "",
        "Result 6": ""
    };

    const updateFocus = () => {
        let items = Array.from(document.querySelectorAll("#search-suggestions li"));
        items.forEach((item, i) => {
            if (i === searchResultIndex) { item.classList.add("hover"); }
            else { item.classList.remove("hover"); }

            item.addEventListener("mouseover", () => {
                items.forEach(_item => {
                    _item.classList.remove("hover");
                });

                item.classList.add("hover");
                searchResultIndex = i;
            })

            item.addEventListener("mousemove", () => {
                items.forEach(_item => {
                    _item.classList.remove("hover");
                });

                item.classList.add("hover");
                searchResultIndex = i;
            })

            item.addEventListener("mouseleave", () => {
                items.forEach(_item => {
                    _item.classList.remove("hover");
                });
            })
        });
    };

    const submitSearch = () => {
        const searchTypes = {
            "DUCKDUCKGO": "https://duckduckgo.com/?q=%s",
            "GOOGLE": "https://www.google.com/search?q=%s",
            "BING": "https://www.bing.com/search?q=%s",
            "YAHOO": "https://ca.search.yahoo.com/search?p=%s",
            "ECOSIA": "https://www.ecosia.org/search?method=index&q=%s"
        };

        document.querySelector("#search").focus()

        chrome.storage.local.get("hamenSearchExtension").then((hamenSearchExtension) => {
            const searchEngine = hamenSearchExtension?.hamenSearchExtension?.settings?.appearance?.searchEngine;
            const rawQuery = document.querySelector("#search").value || "";
            const query = encodeURIComponent(rawQuery);

            if (rawQuery.split(":", 1)) {
                let [key,value] = rawQuery.split(":", 2);

                let redirect = (url, isRawQuery) => window.location.assign(url.replace(/%s/, isRawQuery ? value : encodeURIComponent(value)));

                key = key.trim().toLowerCase();
                switch (key) {
                    case "wikipedia":
                    case "wiki":
                        redirect("https://en.wikipedia.org/wiki/%s", true);
                        return;
                    case "merriam":
                    case "webster":
                    case "mw":
                    case "define":
                    case "definition":
                    case "dict":
                    case "d":
                        redirect("https://www.merriam-webster.com/dictionary/%s");
                        return;
                    case "thesaurus":
                    case "synonym":
                    case "syn":
                    case "s":
                    case "t":
                        redirect("https://www.merriam-webster.com/thesaurus/%s");
                        return;
                }
            };

            if (!searchTypes[searchEngine]) {
                alert("Invalid search engine.");
                return;
            };

            window.location.assign(searchTypes[searchEngine].replace(/%s/, query));
            return;
        })
    };

    window.addEventListener("keydown", e => {
        if (e.key === "/" && document.activeElement === document.body) {
            document.querySelector("#search").focus();
            e.preventDefault();
        } else if (e.key === "Enter" && document.activeElement.tagName === "INPUT") {
            submitSearch();
        }
    });

    const handleKeyPress = (e) => {
        if (e.key === "ArrowDown") {
            searchResultIndex += 1;
            if (searchResultIndex >= Object.keys(searchResults).length) searchResultIndex = 0;
        } else if (e.key === "ArrowUp") {
            searchResultIndex -= 1;
            if (searchResultIndex <= -1) searchResultIndex = Object.keys(searchResults).length - 1;
        }

        updateFocus();
    };
    const hideSearchSuggestions = () => { window.removeEventListener("keydown", handleKeyPress);document.querySelector("#search-suggestions").classList.add("hidden");searchInput.classList.remove("focus") };
    const showSearchSuggestions = () => {
        // window.addEventListener("keydown", handleKeyPress);document.querySelector("#search-suggestions").classList.remove("hidden");searchInput.classList.add("focus")
    };
    searchInput.addEventListener("focus", function() { if (this.value.trim() !== "") { showSearchSuggestions() } else { hideSearchSuggestions(); } });
    searchInput.addEventListener("input", function() { if (this.value.trim() !== "") { showSearchSuggestions() } else { hideSearchSuggestions(); } });
    window.addEventListener("click", e => {
        if (!searchContainer.contains(e.target)) { hideSearchSuggestions(); }
    })
})
