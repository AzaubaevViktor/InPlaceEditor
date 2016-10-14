(function( $ ) {
    const STATE_DISABLE = false;
    const STATE_ENABLE = true;
    $.fn.inPlace = function (action) {
        let options = $.extend({id: this.attr('id')}, $ipe.defaults);
        // Initialization
        if ('object' == (typeof action)) {
            $.extend(options, action);
        } else if ((undefined == action) || ('enable' == action)) {
        } else if ( action === "disable" ) {
            // Disable code.
            console.error("Not implemented")
        } else return this;

        // Заполнение дополнительных полей
        $.extend(options, this.data());
        this.state = this.state || STATE_DISABLE;
        options.value = this.text() || options.value;
        this.inPlaceInput = this.inPlaceInput || new $ipe.types[options.type].InputConstructor(options);

        if (null != options.url) {
            options.dataHandle = data => {
                let ajaxOpt = $.extend({data, url: options.url}, options.ajax);
                return $.ajax(ajaxOpt)
            };
        }

        let updateText = () => {
            this.text(this.inPlaceInput.text);
            if (this.inPlaceInput.isFieldEmpty) {
                this.removeClass('inplace-link-text').addClass('inplace-empty-text')
            } else {
                this.removeClass('inplace-empty-text').addClass('inplace-link-text')
            }
        };

        updateText();

        let submit = () => {
            $(document).off(".inPlace");
            let oldValue = this.inPlaceInput._value; // так как если вызвать .value, он автоматически обновит значение из
            this.inPlaceInput.fieldToValue();
            let value = this.inPlaceInput.value;
            console.log(`Submit with ${value}`);
            let data = {
                name: this.attr('id'),
                value,
                pk: options.pk };

            this.inPlaceInput.inputField.prop('disabled', true);
            this.inPlaceInput.inputForm.find("inplace-submit").prop('disabled', true);

            options.dataHandle(data).then((response) => {
                this.inPlaceInput.submit();
                this.show();
                updateText();
                this.state = !this.state;

                options.submit(data);
            }).catch((error) => {
                this.inPlaceInput._value = oldValue;
                this.inPlaceInput.inputField.prop('disabled', false).addClass("form-control-danger");
                this.inPlaceInput.inputForm.addClass("has-danger").find("inplace-submit").prop('disabled', false);
            })
        };

        let dismiss = () => {
            console.log("Dismiss");
            $(document).off(".inPlace");
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
                this.inPlaceInput.inputForm.insertAfter(this);
                this.inPlaceInput.valueToField();
                this.hide();
                this.inPlaceInput.inputField.focus();

                $(document).on('mousedown.inPlace', document, (e) => {
                    let container = this.inPlaceInput.inputForm;
                    // Проверяем, куда нажали
                    if (!container.is($(e.target))
                        && container.has($(e.target)).length === 0
                        && container.find(`#${$(e.target).attr("id")}`).length == 0
                    ) {
                        dismiss() }
                });

                this.inPlaceInput.inputForm.find("#inplace-submit").click(() => {
                    submit();
                    return false });

                this.inPlaceInput.inputForm.keyup(e => {
                    if(e.keyCode == 13) {
                        submit();
                    } else if (e.keyCode == 27) {
                        dismiss() }
                    return false });
            }
            this.state = !this.state;
            return false;
        });

        return this;
    };

    let $ipe = $.fn.inPlace;

    $ipe.InPlaceInput = class InPlaceInput {
        constructor(options) {
            this.options = options;
            this.id = options.id;
            this.type = options.type;
            this.placeholder = options.placeholder;
            this.size = options.size;
            this._value = null;
            this.value = options.value;

            this._inputField = null;
            this._inputForm = null }
        get inputForm() {};
        get inputField() {};
        generateInputField() {};
        generateButton() {
            let btn = $("<a>").attr('id', 'inplace-submit');
            btn.addClass("btn btn-success");
            if (this.size) {
                btn.addClass(`btn-${this.size}`) }
            return btn }
        removeField() {};
        valueToField() {};
        fieldToValue() {};
        get value() {
            if (null != this._inputField)
                this.fieldToValue();
            return this._value }

        set value(newVal) {
            this._value = newVal;
            if (null != this._inputField)
                this.valueToField() }

        get isFieldEmpty() {
            return (null == this.value) ||
                ("" == this.value) ||
                (undefined == this.value) }

        get text() {
            if (this.isFieldEmpty) {
                return this.options.emptyText }
            return this.valueToText() }

        valueToText() {
            return this.value}

        submit() {
            this.fieldToValue();
            this.removeForm();
            return this.value }

        removeForm() {
            this._inputField.remove();
            this._inputForm.remove();
            this._inputField = this._inputForm = null }

        dismiss() {
            this.removeForm() }
    };

    $ipe.InPlaceTextInput = class InPlaceTextInput extends $ipe.InPlaceInput {
        get inputForm() {
            if (null == this._inputForm) {
                let iF = this.inputField;
                let gB = this.generateButton();
                this._inputForm = $("<div>").attr('id', `in-place-form-${this.id}`).addClass("form-inline").append(
                    $("<div>").addClass("form-group").append(
                        iF,
                        gB.append(
                            $("<i>").addClass('fa fa-check')))) }

            return this._inputForm }

        get inputField() {
            if (null == this._inputField) {
                this._inputField = this.generateInputField();
            }
            return this._inputField }

        generateInputField() {
            let input = $("<input>")
                .attr('id', `in-place-input-field-${this.id}`)
                .attr('type', this.type)
                .attr('placeholder', this.placeholder);
            input.addClass("form-control");
            if (this.size) {
                input.addClass(`form-control-${this.size}`) }
            return input }

        valueToField() {
            this._inputField.val(this._value) }

        fieldToValue() {
            this._value = this._inputField.val() }
    };

    $ipe.InPlaceDateInput = class InPlaceDateInput extends $ipe.InPlaceTextInput {
        get value() {
            if (null != this._inputField)
                this._value = this._inputField.val();
            return this._value }

        set value(newVal) {
            let m = moment(newVal, "DD.MM.YYYY");
            if (!m.isValid()) {
                m = moment(newVal, "YYYY-MM-DD");
            }
            this._value = m.format("YYYY-MM-DD");
            if (null != this._inputField)
                this.valueToField() }

        valueToText() {
            return moment(this._value, "YYYY-MM-DD").format("DD.MM.YYYY") }
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

        valueToText() {
            return this.options.data[this._value].text }

        valueToField() {
            this._inputField.prop("checked", 1 == this._value) }

        fieldToValue() {
            this._value = this._inputField.prop('checked') ? 1 : 0 }
    };

    $ipe.InPlaceSelect2Input = class InPlaceSelect2Input extends $ipe.InPlaceTextInput {
        constructor(options) {
            super(options);
            this.options.select2.data = this.options.data }

        get inputForm() {
            let need_init = null == this._inputForm;
            super.inputForm;
            if (need_init) {
                this.inputField.select2(
                    this.options.select2) }
            return this._inputForm }

        generateInputField() {
            let input = $("<select>")
                .attr('id', `in-place-input-field-${this.id}`)
                .attr('placeholder', this.placeholder);
            input.addClass("form-control");
            if (this.size) {
                input.addClass(`form-control-${this.size}`) }
            return input }

        valueToText() {
            let val = this._value;
            if (('string' == typeof val) || ('number' == typeof val)) {
                val = [val]
            }
            return val.map((index) => {return this.options.select2.data[index].text}).join(", ") }

        valueToField() {
            this._inputField.val(this._value).trigger('change') }
    };

    $ipe.defaults = {
        placeholder: "",
        value: null, // Значение поля
        size: "sm", // Размер элементов
        emptyText: "Empty",
        url: null, // URL, куда отсылать данные. заменяет собой dataHandle
        dataHandle: data => {return new Promise((resolve) => {resolve()})}, // Обработчик данных. Должен возвращать promise
        submit: data => {}, // Обрабатывает данные, которые вернёт dataHandle
        dismiss: data => {}, // Вызывается в случае отмены редактирования
        ajax: {}, // Параметры ajax на отправку
        data: [], // Данные для полей
        select2: {} // настройки для select2
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
        'datetime-local': {
            InputConstructor: $ipe.InPlaceTextInput },
        date: {
            InputConstructor: $ipe.InPlaceDateInput },
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
            InputConstructor: $ipe.InPlaceSelect2Input }
    };
}( jQuery ));