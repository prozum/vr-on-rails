import { reverse } from "dns";
import { isTerminatorless, regExpLiteral } from "babel-types";

import bodyParser = require("body-parser");
import express = require('express');
import os = require('os');
import pty = require('node-pty');
import pug = require('pug');

enum FormatCode {
    ResetAll = 0,
    ModeBold = 1,
    ModeDim = 2,
    ModeUnderlined = 4,
    ModeBlink = 5,
    ModeReverse = 7,
    ModeHidden = 8,
    ResetBold = 21,
    ResetDim = 22,
    ResetUnderlined = 24,
    ResetBlink = 25,
    ResetReverse = 27,
    ResetHidden = 28,
    TxtBlack = 30,
    TxtRed = 31,
    TxtGreen = 32,
    TxtYellow = 33,
    TxtBlue = 34,
    TxtMagenta = 35,
    TxtCyan = 36,
    TxtLightgray = 37,
    TxtDefault = 39,
    BgBlack = 40,
    BgRed = 41,
    BgGreen = 42,
    BgYellow = 43,
    BgBlue = 44,
    BgMagenta = 45,
    BgCyan = 46,
    BgLightgray = 47,
    BgDefault = 49,
    TxtDarkGray = 90,
    TxtLightRed = 91,
    TxtLightGreen = 92,
    TxtLightYellow = 93,
    TxtLightBlue = 94,
    TxtLightMagenta = 95,
    TxtLightCyan = 96,
    TxtWhite = 97,
    BgDarkGray = 100,
    BgLightRed = 101,
    BgLightGreen = 102,
    BgLightYellow = 103,
    BgLightBlue = 104,
    BgLightMagenta = 105,
    BgLightCyan = 106,
}

class Terminal {
    buffer:string[] = [''];
    proc;

    constructor(public guid:Number) {
        const shell = 'bash';
        this.proc = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        });

        let term = this;
        this.proc.on('data', function(data:string) {
            let lines:string[] = [];
            data = term.buffer[term.buffer.length - 1] + data;
            data.split(/\n/).forEach(function(line) {
                let re = /\x1B\[([0-2])?K/;
                let match;
                while ((match = re.exec(line))) {
                    line = line.slice(0, match.index);
                }
                re = /\x08/;
                while ((match = re.exec(line))) {
                    line = line.slice(0, match.index - 1) + line.slice(match.index + 1);
                }
                lines.push(line);
            });
            term.buffer[term.buffer.length - 1] = lines[0];
            term.buffer = term.buffer.concat(lines.slice(1));
        });
    }

    getWrapCols() {
        
    }

    parseBuffer() {
        let curChunk = new TextChunck;
        let chunks:TextChunck[] = [];
        for (let line of this.buffer) {
            curChunk.value = line.replace(/\x1B\[[0-9]+(;[0-9]+)?m/g, '');
            chunks.push(Object.assign({}, curChunk));
        }
        return convToHtml(chunks);
    }

    write(input:string) {
        this.proc.write(input);
    }
}

class TextChunck {
    constructor(public value:string = '',
                public txtColor:FormatCode = FormatCode.TxtDefault, 
                public bgColor:FormatCode = FormatCode.BgDefault, 
                public bold:boolean = false, 
                public dim:boolean = false, 
                public underlined:boolean = false, 
                public blink:boolean = false, 
                public reverse:boolean = false,
                public hidden:boolean = false) {
    }

    applyFormatCode(strCode:String) {
        let code = Number(strCode)
        let codeName = FormatCode[code]
        if (codeName.startsWith('Txt')) {
            this.txtColor = code;
        } else if (codeName.startsWith('Bg')) {
            this.bgColor = code;
        } else if (codeName.endsWith('Bold')) {
            this.bold = codeName.startsWith('Mode');
        } else if (codeName.endsWith('Dim')) {
            this.dim = codeName.startsWith('Mode');
        } else if (codeName.endsWith('Underlined')) {
            this.underlined = codeName.startsWith('Mode');
        } else if (codeName.endsWith('Blink')) {
            this.blink = codeName.startsWith('Mode');
        } else if (codeName.endsWith('Reverse')) {
            this.reverse = codeName.startsWith('Mode');
        } else if (codeName.endsWith('Hidden')) {
            this.hidden = codeName.startsWith('Mode');
        } else if (codeName.endsWith('All')) {
            this.bold = false;
            this.dim = false;
            this.underlined = false;
            this.blink = false;
            this.reverse = false;
            this.hidden = false;
        }
    }
}

function convToWebVR(chunks:TextChunck[]) {
    return 
}
function convToHtml(chunks:TextChunck[]) {
    return '<p>' + chunks.join('</p>\n<p>') + '</p>'
}

var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static('node_modules'));

app.get('/', function (req, res) {
  res.send(pug.renderFile('src/index.pug'));
});

app.get('/xterm/', function (req, res) {

  res.send(pug.renderFile('src/xterm.pug'));
});

let terminals:Terminal[] = [];
app.post('/terminal/', function(req, res) {
    let guid = Math.random();
    terminals.push(new Terminal(guid));
    res.json({'guid': guid});
    res.end();
});

app.get('/terminal/:guid', function(req, res) {
    let terms = terminals.filter(function(term:Terminal) {
        return term.guid == req.params.guid;
    });

    if (terms.length == 1) {
        res.json({'output': terms[0].buffer.slice(
                                Math.max(terms[0].buffer.length - 30, 0)
                            )
        });
    }
    res.end();
});

app.get('/terminal', function(req, res) {
    let terms = terminals.map(function(term:Terminal) {
        return {'guid': term.guid, 'output': term.buffer};
    });

    res.json(terms)
});

function convertKey(key:string)
{
    switch(key)
    {
        case 'Enter': return '\r';
        case 'Backspace': return '\b';
        case 'Alt': return '\x1B';
        case 'AltGraph': return '';
        case 'ControlAlt': return '';
        case 'Control': return '\x5e';
        case 'Shift': return '';
        case 'ArrowUp': return '\x1B[A';
        case 'ArrowDown': return '\x1B[B';
        case 'ArrowRight': return '\x1B[C';
        case 'ArrowLeft': return '\x1B[D';
        default: return key;
    }
}

app.put('/terminal/:guid', function(req, res) {
    let term = terminals.filter(function(term:Terminal) {
        return term.guid == req.params.guid;
    })[0];
    if ('key' in req.body) {
        let data = convertKey(unescape(req.body.key));
        term.write(data);
    }
    res.end();
});

app.put('/terminal/', function(req, res) {
    if ('key' in req.body) {
        terminals.forEach(function(term:Terminal) {
            term.write(convertKey(unescape(req.body.key)));
        })
    }
    res.end();
});


app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
