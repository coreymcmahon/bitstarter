#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development 
and basic DOM parsing.

(references omitted)
*/
var fs = require('fs'),
    program = require('commander'),
    cheerio = require('cheerio'),
    rest = require('restler'),
    HTMLFILE_DEFAULT = 'index.html',
    CHECKSFILE_DEFAULT = 'checks.json';

var assertFileExists = function (infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log('%s does not exist. Exiting.', instr);
	process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var performChecks = function (checks, $) {
    out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
}; 

var checkHtmlFile = function(htmlfile, checksfile) {
    var checks = loadChecks(checksfile).sort(),
        output;

    if(htmlfile.indexOf('://') !== -1) {
	rest.get(htmlfile).on('complete', function (data) {
            $ = cheerio.load(data);
            outputToConsole(performChecks(checks, $));
	});
    } else {
	$ = cheerioHtmlFile(htmlfile);
        outputToConsole(performChecks(checks, $));
    }
};

var outputToConsole = function(output) {
    var outJson = JSON.stringify(output, null, 4);
    console.log(outJson);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
    .option('-c, --checks <check_file>', 'Path to check.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
    .option('-u, --url <url>', 'URL to HTML document')
    .parse(process.argv);

    checkHtmlFile(program.url ? program.url : program.file, program.checks);
} else { 
    exports.checkHtmlFile = checkHtmlFile;
}

