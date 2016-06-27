var playerRecorder;

function initCheckboxes() {
    $('.answers input[type=checkbox]').on('click', function (e) {
        var name = $(this).attr('name');
        var val = $('input[type=text][name=temp-' + name + ']').val().split(',');
        if (this.checked) {
            if (val.length && val.indexOf(this.value) === -1) {
                val.push(this.value);
            }
        } else {
            if (val.length && val.indexOf(this.value) !== -1) {
                var index = val.indexOf(this.value);
                val.splice(index, 1);
            }
        }

        $('input[type=text][name=temp-' + name + ']').val(val.join(','));
    });
}

function initForm() {
    $('#surveyform').forms({
        onSuccess: function (resp, form, config) {
            if (resp.status) {
                form.trigger('reset');
                Msg.info('Survey submitted successfully!');
                setTimeout(function () {
                    window.location = window.location;
                }, 1000);
            } else {
                Msg.error(resp.messages.join('<br/>'));
            }
        }
    })
}

function initGotoCurrentQuestion() {
    var questions = $('#questions').find('.question-item[data-answered=false]');
    if (questions.length > 0) {
        questions.addClass('hide');
        var questionId = questions.first().attr('data-questionId');
        var index = questions.first().removeClass('hide').index();
        $('#questions').find('.question-index').text(index+1);
    }

}

function checkSubmitButton() {
    var done = $('#questions').find('.question-item[data-answered=false]').length < 1;
    if (done) {
        $('#btn-submit-survey').removeClass('hide');
        $('.submit-alert').removeClass('hide');
        $('#questions').find('#question-navigation').addClass('hide');
    }
}

function initVideoRecorder(maxLength) {
    var opt = {
        controls: true,
        width: 540,
        height: 405,
        plugins: {
            record: {
                audio: true,
                video: true,
                debug: true
            }
        }
    };
    if (maxLength) {
        opt.plugins.record.maxLength = maxLength;
    }
    playerRecorder = videojs("myVideo", opt);

    // error handling
    playerRecorder.on('deviceError', function () {
        console.log('device error:', playerRecorder.deviceErrorCode);
    });
    playerRecorder.on('error', function (error) {
        console.log('error:', error);
    });
    // user clicked the record button and started recording
    playerRecorder.on('startRecord', function () {
        console.log('started recording!');
    });
    // user completed recording and stream is available
    playerRecorder.on('finishRecord', function () {
        // the blob object contains the recorded data that
        // can be downloaded by the user, stored on server etc.
        console.log('finished recording: ', playerRecorder.recordedData);
        $('#modal-recorder').find('.btn-submit-video').prop('disabled', false);
    });

    playerRecorder.recorder.getDevice();
}

function initVideoQuestion() {
    $(document).on('click', '.btn-open-recorder', function (e) {
        e.preventDefault();
        var maxLength = $(this).siblings('[data-maxLength]').attr('data-maxLength');
        if (!playerRecorder) {
            initVideoRecorder(maxLength);
        }
        $('#modal-recorder').attr('data-questionId', $(this).attr('data-questionId')).modal({
            backdrop: 'static',
            keyboard: false
        });
    });

    $('#modal-recorder').on('hidden.bs.modal', function (e) {
        playerRecorder.recorder.destroy();
        playerRecorder = null;
        $('#modal-recorder').find('.btn-submit-video').prop('disabled', true);
        $('#modal-recorder .modal-body').html('<video id="myVideo" class="video-js vjs-default-skin"></video>');
    });

    $('#modal-recorder .btn-submit-video').on('click', function (e) {
        e.preventDefault();
        var modal = $('#modal-recorder');
        var questionId = modal.attr('data-questionId');
        if (playerRecorder && playerRecorder.recordedData) {
            var loader = modal.find('.uploading-video').removeClass('hide');
            var formData = new FormData();
            formData.append(questionId, playerRecorder.recordedData.video);
            formData.append('questionId', questionId);
            formData.append('surveyId', $('input[name=temp-surveyId]').val());
            formData.append('userId', $('input[name=temp-user]').val());
            $.ajax({
                type: 'POST',
                url: '/vidsurvey/submitAnswer/',
                data: formData,
                processData: false,
                contentType: false
            }).done(function (resp) {
                if (resp && resp.status && resp.data) {
                    $('#questions').reloadFragment({
                        whenComplete: function () {
                            initGotoCurrentQuestion();
                            checkSubmitButton();
                            loader.addClass('hide');
                        }
                    })
                    modal.modal('hide');
                    Msg.success('Your answer has been submitted');
                } else {
                    Msg.success('Could not submit your answer');
                    loader.addClass('hide');
                    modal.modal('hide');
                    initGotoCurrentQuestion();
                    checkSubmitButton();
                }
            });
        } else {
            Msg.success('Could not submit your answer');
        }
    });
}

function initTimeago() {
    $('.timeago').timeago();
    $('.surveytime').each(function () {
        var txt = $(this).text();
        $(this).text(moment(txt).format('DD/MM/YYYY hh:mm:ss'));
    })
}

$(function () {
    initCheckboxes();
    initForm();
    initTimeago();
    initVideoQuestion();
    //initVideoRecorder();
    initGotoCurrentQuestion();
    checkSubmitButton();
});