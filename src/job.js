var Chop = /** @class */ (function () {
    function Chop() {
        var test = 1;
    }
    return Chop;
}());
var Bulk = /** @class */ (function () {
    function Bulk() {
        var test = 1;
    }
    return Bulk;
}());
var Extruders = /** @class */ (function () {
    function Extruders() {
        var test = 1;
    }
    return Extruders;
}());
var Optimization = /** @class */ (function () {
    function Optimization() {
        var test = 1;
    }
    return Optimization;
}());
var Job = /** @class */ (function () {
    function Job(config) {
        if (config) {
            var jobType = config.jobType;
            var chop = config.Chop;
            var bulk = config.Bulk;
            var extruder = config.Extruder;
            var optimization = config.Optimization;
        }
        else {
            var jobType = 'validation';
            var chop = new Chop();
            var bulk = new Bulk();
            var extruder = new Extruders();
            var optimization = new Optimization();
        }
    }
    return Job;
}());
