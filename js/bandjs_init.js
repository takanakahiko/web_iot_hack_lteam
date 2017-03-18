var tempo = 30;
var volume = 50;
var playing = true;

function pause(){
    playing = !playing;
}


var band_play = function(input){
    var conductor = new BandJS();

    conductor.setTimeSignature(3, 2);
    conductor.setTempo(tempo);
    // conductor.setVolume(volume);

    var rightHand = conductor.createInstrument('square', 'oscillators'),
        leftHand = conductor.createInstrument('triangle', 'oscillators');

    var tone = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#','G', 'G#', 'A', 'A#', 'B'];
    var lebel = ['1', '2', '3', '4', '5', '6'];

    // 音名を番号に変換
    function get_tone_index(_tone_name){
        var tone_index;
        switch (_tone_name){
            case 'C':
                tone_index = 0;
                break;
            case 'C#':
                tone_index = 1;
                break;
            case 'D':
                tone_index = 2;
                break;
            case 'D#':
                tone_index = 3;
                break;
            case 'E':
                tone_index = 4;
                break;
            case 'F':
                tone_index = 5;
                break;
            case 'F#':
                tone_index = 6;
                break;
            case 'G':
                tone_index = 7;
                break;
            case 'G#':
                tone_index = 8;
                break;
            case 'A':
                tone_index = 9;
                break;
            case 'A#':
                tone_index = 10;
                break;
            case 'B':
                tone_index = 11;
                break;
        }
        return tone_index;
    }

    // 基準音からの上下で音を返す
    function get_tone(_tone_index, _lebel, _change){
        var tone_num;
        tone_num = (_tone_index + _change) % 12;
        if(tone_num < 0) tone_num = 12 + tone_num;
        // console.log('tone_num = ' + tone_num);

        var _num;
        if(_tone_index + _change > 11){
            _num = _lebel;
        } else if(_tone_index + _change < 0){
            _num = _lebel - 2;
        } else {
            _num = _lebel - 1;
        }

        // console.log(tone[tone_num] + lebel[_num]);
        return tone[tone_num] + lebel[_num];
    }

    // コードを得る関数
    function get_chord(_tone_num, _num, _version, _inverse_num){

        var chord = '';
        var _change_num = 0;

        // 根音
        chord += get_tone(_tone_num, _num, _change_num);
        chord += ", ";

        switch (_version) {
            // メジャー
            case 0:
                if(_inverse_num == 2){
                    _change_num = -8;
                } else {
                    _change_num = 4;
                }
                chord += get_tone(_tone_num, _num, _change_num);
                chord += ', ';

                if(_inverse_num == 0){
                    _change_num = 7;
                } else {
                    _change_num = -5;
                }
                chord += get_tone(_tone_num, _num, _change_num);
                break;

            // マイナー
            case 1:
                if(_inverse_num == 2){
                    _change_num = -9;
                } else {
                    _change_num = 3;
                }
                chord += get_tone(_tone_num, _num, _change_num);
                chord += ', ';

                if(_inverse_num == 0){
                    _change_num = 7;
                } else {
                    _change_num = -5;
                }
                chord += get_tone(_tone_num, _num, _change_num);
                break;
        }
        // console.log(chord);
        return chord;
    }


    function basic_melody(_tone, _num){
        var tone_num = get_tone_index(_tone);
        rightHand.note('quarter', get_chord(tone_num, _num, 0, 0))
            .note('quarter', get_chord(tone_num+5, _num, 0, 1))
            .note('quarter', get_chord(tone_num, _num, 0, 0))
            .note('quarter', get_chord(tone_num+7, _num, 0, 2))
            .note('quarter', get_chord(tone_num, _num, 0, 0))
            .rest('quarter');
        leftHand.note('quarter', tone[tone_num] + lebel[_num-2])
            .note('quarter', tone[tone_num+5] + lebel[_num-2])
            .note('quarter', tone[tone_num+7] + lebel[_num-2])
            .note('quarter', tone[tone_num+7] + lebel[_num-3])
            .note('quarter', tone[tone_num] + lebel[_num-2])
            .rest('quarter');
    }

    function dark(_tone, _num){
        var tone_num = get_tone_index(_tone);
        rightHand.note('half', get_chord(tone_num, _num, 0, 0))
            .note('half', get_chord(tone_num+5, _num, 1, 1))
            .rest('half');
        leftHand.note('half', tone[tone_num] + lebel[_num-2])
            .note('quarter', tone[tone_num] + lebel[_num-2])
            .note('half', tone[tone_num+5] + lebel[_num-2])
            .rest('half');
    }

    // 1~100の値を受け取る
    function get_music(_value){
        if(_value > 50){
            basic_melody('C', 4);
            console.log('basic-c');
        } else {
            dark('C',4);
            console.log('basic-d');
        }
    }

    console.log('playing = ' + playing);

    //var value = Math.random()*100;
    var value = input*100;
    get_music(value);
    var player = conductor.finish();
    // console.log(player);
    if(playing){
        player.play(true);
    }
}
