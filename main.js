class Dot {
    constructor(x, y, color, gen) {
        this.x = x;
        this.y = y;
        this.gen = gen;
        this.color = color;
    }

    render() {
        const now = Date.now();
        const second = (now % 10000) / 1000;
        let seccondOfGen;
        if (second - this.gen >= 0) {
            seccondOfGen = second - this.gen;
        } else {
            seccondOfGen = 10 - this.gen + second;
        }

        let opacity;
        if (seccondOfGen >= 0 && seccondOfGen <= 2) {
            opacity = 1 - Math.abs(seccondOfGen - 1);
        } else {
            opacity = 0;
        }
        if (opacity === 0) {
            return '';
        }

        let distance;
        if (seccondOfGen >= 0 && seccondOfGen <= 2) {
            distance = seccondOfGen * 22;
        } else {
            distance = 0;
        }
        const vector = {
            x: (Math.sqrt(1) / Math.sqrt(this.x ** 2 + this.y ** 2)) * this.x,
            y: (Math.sqrt(1) / Math.sqrt(this.x ** 2 + this.y ** 2)) * this.y,
        };
        if (this.x ** 2 + this.y ** 2 === 0) {
            (vector.x = 1), (vector.y = 1);
        }
        return `
        <circle
            cx="${this.x + vector.x * distance}"
            cy="${this.y + vector.y * distance}"
            r="1.5"
            fill="${this.color}"
            opacity="${opacity}"
        ></circle>`;
    }
}
function RandomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
class CircleElement {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.dots = this.generateDot();
        this.elemRef = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.elemRef.setAttribute('height', '1');
        this.elemRef.setAttribute('width', '1');
        this.elemRef.setAttribute('overflow', 'visible');
        this.elemRef.style.position = 'fixed';
        this.elemRef.style.top = this.y + 'px';
        this.elemRef.style.left = this.x + 'px';
        this.elemRef.style.transition = 'all 1s';
    }

    generateDot() {
        const result = [];
        for (let i = 0; i < this.size * 20; i++) {
            const x = RandomBetween(-this.size, this.size);
            const y = RandomBetween(-this.size, this.size);
            if (x ** 2 + y ** 2 <= this.size ** 2) {
                result.push(new Dot(x, y, this.color, (i % 20) / 2));
            }
        }
        return result;
    }

    render() {
        const dotHtmls = this.dots.map((dot) => dot.render());
        this.elemRef.innerHTML = dotHtmls.join('');
    }
}

const wrapperElem = document.querySelector('#wrapper');
const circleElems = {};

const COLOR = ['#fb923c', '#84cc16', '#3b82f6', '#d946ef', '#facc15'];

let id = 0;

let windows = JSON.parse(localStorage.getItem('windows'));
if (windows === null) {
    windows = [];
}

windows.forEach((w) => {
    if (w.id > id) {
        id = w.id;
    }
});
id++;

const screen = {
    x: window.screenLeft,
    y: window.screenTop,
    width: window.innerWidth,
    height: window.innerHeight,
};

windows.push({ id, screen });

localStorage.setItem('windows', JSON.stringify(windows));

windows.forEach((w) => {
    const currentScreen = screen;
    console.log(currentScreen);
    if (w.id !== id) {
        const center = getCenter(w.screen);
        circleElems[w.id] = new CircleElement(
            center.x - currentScreen.x,
            center.y - currentScreen.y,
            40 + w.id * 20,
            COLOR[w.id % 5]
        );
        wrapperElem.appendChild(circleElems[w.id].elemRef);
    } else {
        circleElems[w.id] = new CircleElement(
            currentScreen.width / 2,
            currentScreen.height / 2,
            40 + w.id * 20,
            COLOR[w.id % 5]
        );
        wrapperElem.appendChild(circleElems[w.id].elemRef);
    }
});

function step(timeStamp) {
    Object.keys(circleElems).forEach((k) => {
        circleElems[k].render();
    });
    window.requestAnimationFrame(step);
}

window.requestAnimationFrame(step);

const intervalId = setInterval(() => {
    const windowIndex = findWindowIndexById(windows, id);
    if (windowIndex !== null) {
        const prevScreen = windows[windowIndex].screen;
        const currentScreen = {
            x: window.screenLeft,
            y: window.screenTop,
            width: window.innerWidth,
            height: window.innerHeight,
        };

        if (
            currentScreen.x !== prevScreen.x ||
            currentScreen.y !== prevScreen.y ||
            currentScreen.width !== prevScreen.width ||
            currentScreen.height !== prevScreen.height
        ) {
            windows[windowIndex] = {
                id,
                screen: currentScreen,
            };
            windows.forEach((w) => {
                if (w.id !== id) {
                    const center = getCenter(w.screen);
                    if (circleElems[w.id]) {
                        const elemRef = circleElems[w.id].elemRef;
                        elemRef.style.top = center.y - windows[windowIndex].screen.y;
                        elemRef.style.left = center.x - windows[windowIndex].screen.x;
                    } else {
                        circleElems[w.id] = new CircleElement(
                            center.x - windows[windowIndex].screen.x,
                            center.y - windows[windowIndex].screen.y,
                            40 + w.id * 20,
                            COLOR[w.id % 5]
                        );
                        wrapperElem.appendChild(circleElems[w.id].elemRef);
                    }
                }
            });
            const elemRef = circleElems[id].elemRef;
            elemRef.style.top = currentScreen.height / 2;
            elemRef.style.left = currentScreen.width / 2;
            localStorage.setItem('windows', JSON.stringify(windows));
        }
    }
}, 200);

window.addEventListener('storage', (e) => {
    if (e.key === 'windows') {
        windows = JSON.parse(e.newValue);
        const oldWindows = JSON.parse(e.oldValue);
        const windowIndex = findWindowIndexById(windows, id);
        windows.forEach((w) => {
            if (w.id !== id) {
                const center = getCenter(w.screen);
                if (circleElems[w.id]) {
                    const elemRef = circleElems[w.id].elemRef;
                    elemRef.style.top = center.y - windows[windowIndex].screen.y;
                    elemRef.style.left = center.x - windows[windowIndex].screen.x;
                } else {
                    circleElems[w.id] = new CircleElement(
                        center.x - windows[windowIndex].screen.x,
                        center.y - windows[windowIndex].screen.y,
                        40 + w.id * 20,
                        COLOR[w.id % 5]
                    );
                    wrapperElem.appendChild(circleElems[w.id].elemRef);
                }
            }
        });
        if (windows.length < oldWindows.length) {
            let deletedId = null;
            oldWindows.forEach((oW) => {
                if (findWindowIndexById(windows, oW.id) === null) {
                    deletedId = oW.id;
                }
            });

            if (deletedId !== null) {
                const elemRef = circleElems[deletedId].elemRef;
                elemRef.remove();
                delete circleElems[deletedId];
            }
        }
    }
});

window.addEventListener('beforeunload', (e) => {
    clearInterval(intervalId);
    const windowIndex = findWindowIndexById(windows, id);
    if (windowIndex !== null) {
        windows.splice(windowIndex, 1);
        localStorage.setItem('windows', JSON.stringify(windows));
    }
});

function findWindowIndexById(windows, id) {
    let index = null;
    windows.forEach((w, i) => {
        if (w.id === id) {
            index = i;
        }
    });
    return index;
}

function getCenter(screen) {
    return { x: screen.x + screen.width / 2, y: screen.y + screen.height / 2 };
}
