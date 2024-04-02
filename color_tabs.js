(function color_tabs() {
    "use strict";

    const WHITE = chroma('#FFF');
    const BLACK = chroma('#000');
    const SATURATION = 0.5;

    const STYLE = `
        .tab.active {
            border-top-style: solid;
            border-top-width: 2px;
            border-top-color: var(--colorAccentFg);
            justify-content: flex-end;
        }

        .tab .favicon:not(.svg) {
            filter: drop-shadow(1px 0 0 rgba(246, 246, 246, 0.75)) drop-shadow(-1px 0 0 rgba(246, 246, 246, 0.75)) drop-shadow(0 1px 0 rgba(246, 246, 246, 0.75)) drop-shadow(0 -1px 0 rgba(246, 246, 246, 0.75));
        }
    `;

    class ColorTabs {
        #observer = null;

        constructor() {
            this.#addStyle();
            this.#colorTabs();
            this.#addListeners();
        }

        #addStyle() {
            const style = document.createElement('style');
            style.innerHTML = STYLE;
            this.#head.appendChild(style);
        }

        #addListeners() {
            const tabStrip = document.querySelector('div.tab-strip');
            this.#observer = new MutationObserver(() => {
                this.#colorTabs();
                setTimeout(() => {
                    this.#colorTabs();
                }, 100);
            });
            this.#observer.observe(tabStrip, {childList: true, subtree: true});

            vivaldi.tabsPrivate.onThemeColorChanged.addListener(() => {
                this.#colorTabs();
                setTimeout(() => {
                    this.#colorTabs();
                }, 100);
            });
        }

        #colorTabs() {
            const tabs = document.querySelectorAll('div.tab');
            tabs.forEach((tab) => {
                this.#setTabColor(tab);
            });
        }

        #setTabColor(tab) {
            var bgColor = null;
            var image = tab.querySelector('img');
            if (image) {
                const palette = this.#getPalette(image);
                if (!palette || palette.length === 0) return;
                bgColor = chroma(palette[0]);
            } else {
                bgColor = chroma(this.#browser.style.getPropertyValue('--colorBg'));
            }
            bgColor = bgColor.set('hsl.s', SATURATION);
            const isBright = bgColor.luminance() > 0.4;
            const fgColor = isBright ? BLACK : WHITE;

            if (tab.classList.contains('active')) {
                this.#setAccentColors(bgColor, isBright);
            } else {
                tab.style.backgroundColor = bgColor.css();
                tab.style.color = fgColor.css();
            }
        }

        #setAccentColors(accentBg, isBright) {
            this.#setColor('--colorAccentBg', accentBg);
            this.#setColor('--colorAccentBgDark', accentBg.darken(.4));
            this.#setColor('--colorAccentBgDarker', accentBg.darken(1));
            this.#setColor('--colorAccentBgAlpha', accentBg.alpha(isBright ? .45 : .55));
            this.#setColor('--colorAccentBgAlphaHeavy', accentBg.alpha(isBright ? .25 : .35));

            this.#setColor('--colorAccentFg', isBright ? BLACK : WHITE);
            this.#setColor('--colorAccentFgAlpha', accentBg.alpha(.15));
            this.#setColor('--colorAccentFgAlphaHeavy', accentBg.alpha(.05));
        }

        #getPalette(image) {
            const w = image.width;
            const h = image.height;

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;

            const context = canvas.getContext('2d');
            context.imageSmoothingEnabled = false;
            context.drawImage(image, 0, 0, w, h);

            const pixelData = context.getImageData(0, 0, w, h).data;
            const pixelCount = pixelData.length / 4;

            const colorPalette = [];

            for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
                const offset = 4 * pixelIndex;
                const red = pixelData[offset];
                const green = pixelData[offset + 1];
                const blue = pixelData[offset + 2];
                let colorIndex;

                if (!(red === 0 || red > 240 && green > 240 && blue > 240)) {
                    for (let colorIndexIterator = 0; colorIndexIterator < colorPalette.length; colorIndexIterator++) {
                        const currentColor = colorPalette[colorIndexIterator];
                        if (red === currentColor[0] && green === currentColor[1] && blue === currentColor[2]) {
                            colorIndex = colorIndexIterator;
                            break;
                        }
                    }
                    if (colorIndex === undefined) {
                        colorPalette.push([red, green, blue, 1]);
                    } else {
                        colorPalette[colorIndex][3]++;
                    }
                }
            }
            colorPalette.sort((a, b) => b[3] - a[3]);
            const topColors = colorPalette.slice(0, Math.min(10, colorPalette.length));
            return topColors.map(color => [color[0], color[1], color[2]]);
        }

        #setColor(property, color) {
            this.#browser.style.setProperty(property, color.css());
        }

        // utils

        #getVivaldiTab(id) {
            return document.querySelector(`div.tab#tab-${id}`);
        }

        // getters

        get #browser() {
            return document.querySelector('#browser');
        }

        get #head() {
            return document.querySelector('head');
        }
    };

    setTimeout(() => {
        var interval = setInterval(() => {
            if (document.querySelector('#browser')) {
                window.colorTabs = new ColorTabs();
                clearInterval(interval);
            }
        }, 100);
    }, 1000);
})()