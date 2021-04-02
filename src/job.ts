
class Chop {
    constructor() {
        const test = 1
    }
}

class Bulk {
    constructor() {
        const test = 1
    }
}

class Extruders {
    constructor() {
        const test = 1
    }
}

class Optimization {
    constructor() {
        const test = 1
    }
}

class Job {
    constructor(config: { jobType: string; Chop: Chop; Bulk: Bulk; Extruder: Extruders; Optimization: Optimization; }) {
        if (config) {
            const jobType: string = config.jobType;
            const chop: Chop = config.Chop;
            const bulk: Bulk = config.Bulk;
            const extruder: Extruders = config.Extruder;
            const optimization: Optimization = config.Optimization;
        } else {
            const jobType: string = 'validation';
            const chop: Chop = new Chop();
            const bulk: Bulk = new Bulk();
            const extruder: Extruders = new Extruders();
            const optimization: Optimization = new Optimization();
        }
    }
}



