export function throttle(callback) {
    let pending = false;
    let frameId = null;
    let lastArgs;

    const throttled = (...args) => {
        lastArgs = args;
        if (frameId) {
            pending = true;
        } else {
            callback(...lastArgs);
            frameId = requestAnimationFrame(() => {
                frameId = null;
                if (pending) {
                    callback(...lastArgs);
                    pending = false;
                }
            });
        }
    };

    const cancel = () => {
        // TODO: reove cast once types are updated
        cancelAnimationFrame(frameId);
        pending = false;
        frameId = null;
    };

    return Object.assign(throttled, { cancel });
}

export function createAsyncTasksQueue() {
    const tasks = [];
    let frameId = null;

    function runTasks() {
        let task;
        while ((task = tasks.shift())) {
            task();
        }
        frameId = null;
    }

    function add(task) {
        tasks.push(task);
        if (!frameId) {
            frameId = requestAnimationFrame(runTasks);
        }
    }

    function cancel() {
        tasks.splice(0);
        // TODO: reove cast once types are updated
        cancelAnimationFrame(frameId);
        frameId = null;
    }

    return { add, cancel };
}
