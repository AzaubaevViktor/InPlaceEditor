// Функция для поиска по спискам внутри массива по полю
let findByInDictField = function(arr, fieldName, value) {
    "use strict";
    let results = [];
    for (let d of arr) {
        if (value == d[fieldName]) {
            results.push(d);
        }
    }
    return results;
};

(function( $ ) {
    "use strict";
    const STATE_DISABLE = false;
    const STATE_ENABLE = true;
    $.fn.inPlace = function (action) {
        let options = $.extend(true, {id: this.attr('id')}, $ipe.defaults);
        // Initialization
        if ('object' === (typeof action)) {
            $.extend(true, options, action);
        } else if ((undefined === action) || ('enable' === action)) {
            console.log("Activate")
        } else if ( action === "disable" ) {
            // Disable code.
            console.error("Not implemented");
            return;
        } else {
            return this;
        }

        // Заполнение дополнительных полей
        $.extend(true, options, this.data());
        this.state = this.state || STATE_DISABLE;
        options.value = this.text() || options.value;
        if (!$ipe.types[options.type]) {
            console.error(`Поле ввода с типом '${options.type}' не сущесвует/не реализовано в inPlace.`);
            return;
        }
        this.inPlaceInput = this.inPlaceInput || new $ipe.types[options.type].InputConstructor(options);

        // Иницализация функции, передающей данные на сервер
        if (null != options.url) {
            options.dataHandle = data => {
                return options.ajaxSender(options, data)
            };
        }

        let updateText = () => {
            this.text(this.inPlaceInput.text);
            if (this.inPlaceInput.isValueEmpty) {
                this.removeClass('inplace-link-text').addClass('inplace-empty-text')
            } else {
                this.removeClass('inplace-empty-text').addClass('inplace-link-text')
            }
        };

        updateText();

        let disableInputs = () => {
            this.inPlaceInput.inputField.prop('disabled', true);
            this.inPlaceInput.inputForm.find("#inplace-submit").prop('disabled', true).off();
            $(document).off(".inPlace");
        };

        let enableInputs = () => {
            this.inPlaceInput.inputField.prop('disabled', false).addClass("form-control-danger");

            $(document).on('mousedown.inPlace', document, (e) => {
                let container = this.inPlaceInput.inputForm;
                // Проверяем, куда нажали
                if (!container.is($(e.target))
                    && container.has($(e.target)).length === 0
                    && container.find(`#${$(e.target).attr("id")}`).length == 0
                ) {
                    dismiss() }
            });
            this.inPlaceInput.inputForm.find("#inplace-submit").on('click.inPlace', () => {
                submit();
                return false });

            this.inPlaceInput.inputForm.on('keyup.inPlace', e => {
                if (this.inPlaceInput.checkSubmitKeys(e)) {
                    submit();
                } else if (this.inPlaceInput.checkDismissKeys(e)) {
                    dismiss() }
                return false });
        };

        let submit = () => {
            $(document).off(".inPlace");
            this.inPlaceInput.updateValue();
            let value = this.inPlaceInput.value;
            console.log(`Submit with ${value}`);
            let data = {
                name: options.id,
                value,
                pk: options.pk };

            disableInputs();

            options.dataHandle(data).then((response) => {
                // Всё ок
                this.inPlaceInput.submit();
                this.show();
                updateText();
                this.state = !this.state;

                options.submit(data, {
                    'raw': this.inPlaceInput._value,
                    'value': this.inPlaceInput.value
                });
            }).catch((error) => {
                // Всё плохо
                console.error(error);
                this.inPlaceInput.inputForm.addClass("has-danger").find("inplace-submit").prop('disabled', false);
                this.inPlaceInput.value = this.oldValue;
                enableInputs();
            })
        };

        let dismiss = () => {
            console.log("Dismiss");
            disableInputs();
            this.inPlaceInput.dismiss();
            this.show();
            this.state = !this.state;

            let data = {
                name: this.attr('id'),
                pk: options.pk
            };
            options.dismiss(data);
        };

        // Инциализация всяких событий
        this.click(event => {
            if (STATE_DISABLE == this.state) {
                this.oldValue = this.inPlaceInput.value;
                this.hide();
                this.inPlaceInput.inputForm.insertAfter(this);
                this.inPlaceInput.updateField();
                this.inPlaceInput.inputField.focus();

                enableInputs();
            }
            this.state = !this.state;
            return false;
        });

        return this;
    };

    let $ipe = $.fn.inPlace;

    $ipe.InPlaceInput = class InPlaceInput {
        constructor(options) {
            this.options = $.extend(true, {}, options);
            this.id = this.options.id;
            this.type = this.options.type;
            this.placeholder = this.options.placeholder;
            this.size = this.options.size;
            this._value = null;
            this.value = this.options.value;

            this._inputField = null;
            this._inputForm = null }
        // Условие для подтвеждения данных через нажатия кнопкок
        checkSubmitKeys(event) {return event.keyCode == 13};

        // Условие для отмены ввода через нажатия кнопкок
        checkDismissKeys(event) {return (event.keyCode == 27)};

        // Возвращает форму ввода
        get inputForm() {
            if (null == this._inputForm) {
                this._generateForm();
            }

            return this._inputForm }

        // Создаёт форму
        _generateForm() {
            let iF = this.inputField;
            let gB = this._generateButton();
            this._inputForm = $("<div>").attr('id', `in-place-form-${this.id}`).addClass("form-inline").append(
                $("<div>").addClass("form-group").append(
                    iF,
                    gB.append(
                        $("<i>").addClass('fa fa-check')))) }

        // Возвращает поле ввода
        get inputField() {
            if (null == this._inputField) {
                this._inputField = this.generateInputField();
            }
            return this._inputField }

        // Удаляет форму ввода
        removeForm() {
            this._inputField.remove();
            this._inputForm.remove();
            this._inputField = this._inputForm = null }

        // Функция генерирует новое поле ввода
        _generateInputField() {};

        // Функция генерирует кнопку подтверждения
        _generateButton() {
            let btn = $("<a>").attr('id', 'inplace-submit');
            btn.addClass("btn btn-success");
            if (this.size) {
                btn.addClass(`btn-${this.size}`) }
            return btn }

        // Функция обновляет значение в поле, если оно существует
        updateField() {
            if (null != this._inputField) {
                this._valueToField();
            } else {
                console.error(this, "Input field does not exist!") }}

        // Функция обновляет значение в поле
        _valueToField() {
            this._inputField.val(this._value)}

        // Обновляет внутреннее значение value, если поле ввода существует
        updateValue() {
            if (null != this._inputField) {
                this._fieldToValue();
            } else {
                console.error(this, "Input field does not exist!") }}

        // Обновляет внутреннее значение value
        _fieldToValue() {
            this.value = this._inputField.val()};

        // Возвращает внутреннее значение
        get value() {
            return this._value }

        // Преобразовывает внешнее значение во внутреннее
        set value(newVal) {
            this._value = newVal }

        // Проверяет, пустое ли значение
        get isValueEmpty() {
            if ((null === this.value) ||
                ("" === this.value) ||
                (undefined === this.value) ||
                (false === this.value)) {
                return true;
            } else if (this.value.length == 0) {
                return true;
            }
            return false;
        }

        // Преобразовывает внутреннее значение в текст, которыое будет отображаться
        get text() {
            if (this.isValueEmpty) {
                return this.options.emptyText }
            return this._valueToText() }

        // Преобразовывает внутреннее значение в текст
        _valueToText() {
            return this.value}

        // Действия при submit
        submit() {
            this._fieldToValue();
            this.removeForm();
            return this.value }

        // Действия при dismiss
        dismiss() {
            this.removeForm() }
    };

    $ipe.InPlaceTextInput = class InPlaceTextInput extends $ipe.InPlaceInput {
        generateInputField() {
            let input = $("<input>")
                .attr('id', `in-place-input-field-${this.id}`)
                .attr('type', this.type)
                .attr('placeholder', this.placeholder);
            input.addClass("form-control");
            if (this.size) {
                input.addClass(`form-control-${this.size}`) }
            return input }
    };

    $ipe.InPlaceDateInput = class InPlaceDateInput extends $ipe.InPlaceTextInput {
        get value() {
            return super.value }

        set value(newVal) {
            let m = null;
            if (newVal) {
                if (newVal.indexOf(".") !== -1) {
                    m = moment(newVal, "DD.MM.YYYY");
                } else {
                    m = moment(newVal);
                }
            }
            if (null === m || !m.isValid()) {
                this._value = null;
            } else {
                this._value = m.format("YYYY-MM-DD");
            }}

        _valueToText() {
            return moment(this._value, "YYYY-MM-DD").format("DD.MM.YYYY") }
    };

    $ipe.InPlaceDateTimeInput = class InPlaceDateTimeInput extends $ipe.InPlaceTextInput {
        get value() {
            return super.value }

        set value(newVal) {
            let m = null;
            if (newVal) {
                if (newVal.indexOf(".") !== -1) {
                    m = moment(newVal, "DD.MM.YYYY HH:mm");
                } else {
                    m = moment(newVal, "YYYY-MM-DDTHH:mm");
                }
            }
            if (null === m || !m.isValid()) {
                this._value = null;
            } else {
                this._value = m.format("YYYY-MM-DDTHH:mm");
            }}

        _valueToText() {
            return moment(this._value, "YYYY-MM-DDTHH:mm").format("DD.MM.YYYY HH:mm") }

    };

    $ipe.InPlaceCheckBoxInput = class InPlaceCheckBoxInput extends $ipe.InPlaceTextInput {
        generateInputField() {
            let input = $("<input>")
                .attr('id', `in-place-input-field-${this.id}`)
                .attr('type', this.type)
                .attr('placeholder', this.placeholder);
            input.addClass("form-check-input");
            if (this.size) {
                input.addClass(`form-check-input-${this.size}`) }
            return input }

        set value(newVal) {
            newVal = !!newVal;
            super.value = newVal;
        }

        get value() {
            return super.value }

        _valueToText() {
            return findByInDictField(this.options.data, 'id', this._value ? 1 : 0)[0].text }

        _valueToField() {
            this._inputField.prop("checked", this._value) }

        _fieldToValue() {
            this._value = this._inputField.prop('checked') }
    };

    $ipe.InplaceTextAreaInput = class InplaceTextAreaInput extends $ipe.InPlaceTextInput {
        constructor(options) {
            super(options);
            this.rows = this.options.rows }

        generateInputField() {
            let textarea = $("<textarea>").attr('id', `in-place-input-field-${this.id}`)
                .attr('placeholder', this.placeholder)
                .attr('rows', this.rows);
            textarea.addClass("form-control");
            if (this.size) {
                textarea.addClass(`form-check-input-${this.size}`) }
            return textarea }

        checkSubmitKeys(event) {return event.ctrlKey && event.keyCode == 13}
    };

    $ipe.InPlaceSelect2Input = class InPlaceSelect2Input extends $ipe.InPlaceTextInput {
        constructor(options) {
            super(options);
            console.group(`InPlaceSelect2Input Init for ${this.options.id}`);
            console.log("Options select2 before extend:", this.options.select2);
            if (!this.options.customValueSelect2) {
                this.options.select2.data = this.options.select2.data || [];
                this.options.select2.data = $.extend(true, [], $.unique($.merge(this.options.select2.data, this.options.data)));
            } else {
                this._initDataFromValue();
            }
            console.log(`Options select2 after extend:`, this.options.select2);
            console.groupEnd();
        }

        checkSubmitKeys(event) {return event.ctrlKey && event.keyCode == 13}

        get inputForm() {
            let need_init = null == this._inputForm;
            super.inputForm;
            if (need_init) {
                console.log("Init select2 input field with ", this.options.select2);
                this.inputField.select2(
                    $.extend(true, {}, this.options.select2)) }
            return this._inputForm }

        generateInputField() {
            let input = $("<select>")
                .attr('id', `in-place-input-field-${this.id}`)
                .attr('placeholder', this.placeholder);
            input.addClass("form-control");
            if (this.size) {
                input.addClass(`form-control-${this.size}`) }
            return input }

        set value(newVal) {
            console.log("New Value: ", newVal);
            if (('string' == typeof newVal) &&
                !('number' == typeof newVal) &&
                newVal.includes(","))
            {
                this._value = newVal.split(",").map((val) => val.trim());
                if (1 == this._value.length) {
                    this._value = this._value[0] }
            } else {
                this._value = newVal
            }
        }

        get value() {
            return super.value }

        _initDataFromValue() {
            console.log("Try to init data from value");
            let data = this._value;
            if (this.options.customValueSelect2 && (!this.isValueEmpty)) {
                let values = null;
                if ("string" == typeof this._value) {
                    values = [this._value]
                } else {
                    values = this._value
                }
                this.options.select2.data =
                    values.map((val) => {
                        return {id: val, text: val}
                    });
                console.log("Set data", console.log(this.options.select2.data));
            }
        }

        _valueToText() {
            let val = this._value;

            if (this.options.customValueSelect2) {
                if ('string' == typeof val) {
                    return val;
                } else {
                    return val.join(", ")
                }
            } else {
                if (('string' == typeof val) || ('number' == typeof val)) {
                    val = [val] }
                console.log(`_valueToText; value:`, val, "options.select2:", this.options.select2);
                return val.map((index) => {
                    return findByInDictField(this.options.select2.data, 'id', index)[0].text
                }).join(", ")
            }
        }

        _valueToField() {
            console.log(`Set select2 '${this.options.id}' value`, this._value);
            this.inputField.val(this._value).trigger('change');
        }

        _fieldToValue() {
            super._fieldToValue();

            if (this.options.numericId) {
                if ('string' == this._value) {
                    this._value *= 1
                } else if ('object' == typeof this._value) {
                    this._value = this._value.map((v) => v * 1)
                }
            }
            this._initDataFromValue();
        }
    };

    $ipe.defaults = {
        placeholder: "",
        value: null, // Значение поля
        size: "sm", // Размер элементов
        emptyText: "Empty",
        url: null, // URL, куда отсылать данные. заменяет dataHandle, используя ajaxSender
        // Обработчик данных. Должен возвращать promise. Переопределяется url
        dataHandle: data => {return new Promise((resolve) => {resolve()})},
        ajaxSender: (opts, data) => {
            let ajaxOpt = $.extend({data: JSON.stringify(data), url: opts.url}, opts.ajax);
            return $.ajax(ajaxOpt)
        }, // Отправляет ajax запрос, используется, если есть url. Возвращает Promise
        submit: (data, values) => {}, // Обрабатывает данные, которые вернёт dataHandle
        dismiss: data => {}, // Вызывается в случае отмены редактирования
        ajax: {
            contentType: 'application/json',
            dataType: 'json'
        }, // Параметры ajax на отправку
        data: [], // Данные для полей
        select2: {}, // настройки для select2
        rows: 4, // Для textarea
        customValueSelect2: false, // В select2 позволяет работать со значениями пользователей
        // Когда отключено, значения превращаются в цифры
        numericId: true // Преобразовывет значения сырых данных в числа для select2
    };

    $ipe.types = {
        text: {
            InputConstructor: $ipe.InPlaceTextInput },
        number: {
            InputConstructor: $ipe.InPlaceTextInput },
        email: {
            InputConstructor: $ipe.InPlaceTextInput },
        url: {
            InputConstructor: $ipe.InPlaceTextInput },
        tel: {
            InputConstructor: $ipe.InPlaceTextInput },
        date: {
            InputConstructor: $ipe.InPlaceDateInput },
        'datetime-local': {
            InputConstructor: $ipe.InPlaceDateTimeInput },
        // month: {
        //     InputConstructor: $ipe.InPlaceTextInput },
        // week: {
        //     InputConstructor: $ipe.InPlaceTextInput },
        time: {
            InputConstructor: $ipe.InPlaceTextInput },
        // color: {
        //     InputConstructor: $ipe.InPlaceTextInput },
        checkbox: {
            InputConstructor: $ipe.InPlaceCheckBoxInput },
        select2: {
            InputConstructor: $ipe.InPlaceSelect2Input },
        textarea: {
            InputConstructor: $ipe.InplaceTextAreaInput },
    };
}( jQuery ));