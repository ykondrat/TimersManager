class TimersManager {
    constructor () {
        this.timers = [];
        this.requiredProperties = ['name', 'delay', 'interval', 'job'];
        this.logs = [];
        this.mainTimer = null;
    }

    _checkTimer (timer) {
        const existedTimersName = this.timers.map((item) => item.name);
        const arrayOfTimerKeys = Object.keys(timer);

        // Check if type of timer is object
        if (typeof timer !== 'object') {
            throw new Error(
                'timer must be an object:\n{\n' +
                '\tname*:     String, // timer name\n' +
                '\tdelay*:    Number,  // timer delay in ms\n' +
                '\tinterval*: Boolean, // is timer or interval\n' +
                '\tjob*:      Function, // timer job\n' +
                '}\n'
            );
        }

        // Check all properties of timer
        for (const key in timer) {
            if (timer.hasOwnProperty(key)) {
                if (key === 'name' && typeof timer[key] !== 'string') {
                    throw new Error('name must be a string');
                } else if (key === 'delay' && (typeof timer[key] !== 'number' || (timer[key] < 0 || timer[key] > 5000))) {
                    throw new Error('delay must be a number and cannot be less than 0 and greater than 5000')
                } else if (key === 'interval' && typeof timer[key] !== 'boolean' ) {
                    throw new Error('interval must be a boolean');
                } else if (key === 'job' && typeof timer[key] !== 'function') {
                    throw new Error('job must be a function');
                }
            }
        }

        // Check if all properties of timer is set
        for (let i = 0; i < this.requiredProperties.length; i++) {
            if (!arrayOfTimerKeys.includes(this.requiredProperties[i])) {
                throw new Error(`Property ${this.requiredProperties[i]} is required`);
            }
        }

        // Check if timer name is uniq
        if (existedTimersName.includes(timer.name)) {
            throw new Error('Such timer name already exist');
        }
    }

    _clearTask (index) {
        // If interval === true work with interval
        if (this.timers[index].interval) {
            clearInterval(this.timers[index].task);
            this.timers[index].task = null;
        } else {
            clearTimeout(this.timers[index].task);
            this.timers[index].task = null;
        }
    }

    _handlerTask (timer) {
        return () => {
            try {
                const result = timer.job(...timer.params);

                this._log(timer, result);
            } catch (error) {
                this._log(timer, void 0, error);
            }
        }
    }

    _startTask (index) {
        // If interval === true work with interval
        if (this.timers[index].interval) {
            this.timers[index].task = setInterval(this._handlerTask(this.timers[index]), this.timers[index].delay);
        } else {
            this.timers[index].task = setTimeout(this._handlerTask(this.timers[index]), this.timers[index].delay);
        }
    }

    _startMainTimer (time) {
        this.mainTimer = setTimeout(() => {
            for (let i = 0; i < this.timers.length; i++) {
                this.remove(this.timers[i].name);
            }

            clearTimeout(this.mainTimer);
        }, time + 10000);
    }

    add (timer, ...props) {
        this._checkTimer(timer);
        // Set arguments for timer in params
        timer.params = props;
        this.timers.push(timer);

        return this;
    }

    remove (timerName) {
        const index = this.pause(timerName);

        if (index >= 0) {
            this.timers.splice(index, 1);
        }

        return this;
    }

    start () {
        let max = 0;
        for (let i = 0; i < this.timers.length; i++) {
            // If task already started dont start it again
            if (!this.timers[i].task) {
                this._startTask(i);
            }
            if (this.timers[i].delay > max) {
                max = this.timers[i].delay;
            }
        }
        this._startMainTimer(max);
    }

    stop () {
        for (let i = 0; i < this.timers.length; i++) {
            // If task already stopped wont stop it again
            if (this.timers[i].task) {
                this._clearTask(i);
            }
        }
    }

    pause (timerName) {
        if (typeof timerName === 'string') {
            for (let i = 0; i < this.timers.length; i++) {
                if (this.timers[i].name === timerName) {
                    if (!this.timers[i].task) {
                        // If task on pause return null
                        return null;
                    }
                    this._clearTask(i);

                    // If task stopped return index of timer
                    return i;
                }
            }
            // If there is no task with such name return -1
            return -1;
        } else {
            throw new Error('Timer name must be a string');
        }
    }

    resume (timerName) {
        if (typeof timerName === 'string') {
            for (let i = 0; i < this.timers.length; i++) {
                if (this.timers[i].name === timerName) {
                    if (this.timers[i].task) {
                        // If task already started
                        return null;
                    }
                    this._startTask(i);

                    // If task started return index of timer
                    return i;
                }
            }
            // If there is no task with such name return -1
            return -1;
        } else {
            throw new Error('Timer name must be a string');
        }
    }

    print () {
        for (let i = 0; i < this.logs.length; i++) {
            console.log(this.logs[i]);
        }
    }

    _log (timer, result, error = null) {
        const errorLog = {
            name:    timer.name,
            in:      timer.params,
            out:     result,
            created: new Date(),
        };

        if (error) {
            errorLog.error = {
                name:    error.name,
                message: error.message,
                stack:   error.stack,
            }
        }

        this.logs.push(errorLog);
    }
}
