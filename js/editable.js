(function( $ ) {
    const STATE_DISABLE = false;
    const STATE_ENABLE = true;
    $.fn.inPlace = function (action) {
        let options = $.extend({}, $ipe.defaults);
        // Initialization
        if ('object' == (typeof action)) {
            $.extend(options, action);
        } else if ((undefined == action) || ('enable' == action)) {
        } else if ( action === "disable" ) {
            // Disable code.
            console.log("Not implemented")
        } else return this;

        // Заполнение дополнительных полей
        $.extend(options, this.data());
        this.state = this.state || STATE_DISABLE;
        options.value = this.text() || options.value;
        this.inPlaceInput = this.inPlaceInput || new $ipe.types[options.type].InputConstructor(options);

        this.text(this.inPlaceInput.textValue);

        this.css($ipe.style.linkText);

        let ajaxSend = _ => {return new Promise((resolve) => {resolve()})};

        if (null != options.url) {
            ajaxSend = data => {
                let ajaxOpt = $.extend({data, url: options.url}, options.ajax);
                return $.ajax(ajaxOpt)
            };
        }

        let submit = () => {
            $(document).off(".inPlace");
            this.inPlaceInput.fieldToValue();
            let value = this.inPlaceInput.value;
            console.log(`Submit with ${value}`);
            let data = {
                name: this.attr('id'),
                value,
                pk: options.pk };

            this.inPlaceInput.inputField.prop('disabled', true);
            this.inPlaceInput.inputForm.find("inplace-submit").prop('disabled', true);

            ajaxSend(data).then((response) => {
                this.inPlaceInput.submit();
                this.show();
                this.text(this.inPlaceInput.textValue);
                this.state = !this.state;

                options.submit(data);
            }).catch((error) => {
                this.inPlaceInput.inputField.prop('disabled', false);
                this.inPlaceInput.inputForm.find("inplace-submit").prop('disabled', false);
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

        // События
        this.click(event => {
            if (STATE_DISABLE == this.state) {
                this.inPlaceInput.inputForm.insertAfter(this);
                this.hide();
                this.inPlaceInput.inputField.focus();

                $(document).on('mousedown.inPlace', document, (e) =>
                {
                    let container = this.inPlaceInput.inputForm;
                    if (!container.is(e.target) // if the target of the click isn't the container...
                        && container.has(e.target).length === 0) // ... nor a descendant of the container
                    {
                        dismiss();
                    }
                });

                this.inPlaceInput.inputForm.find("#inplace-submit").click(() => {
                    submit();
                    return false;
                });

                this.inPlaceInput.inputForm.keyup(e => {
                    if(e.keyCode == 13) {
                        submit();
                    } else if (e.keyCode == 27) {
                        dismiss();
                    }
                    return false;
                });
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

        get textValue() {
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
        constructor(options) {
            super(options);
        }
        get inputForm() {
            if (null == this._inputForm) {
                this._inputForm = $("<div>").attr('id', `in-place-form-${this.id}`).addClass("form-inline").append(
                    $("<div>").addClass("form-group").append(
                        this.inputField,
                        this.generateButton().append(
                            $("<i>").addClass('fa fa-check'))));
                this.valueToField() }

            return this._inputForm;
        }

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

        get textValue() {
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

        get textValue() {
            return this.options.data[this._value].text }

        valueToField() {
            this._inputField.prop("checked", 1 == this._value) }

        fieldToValue() {
            this._value = this._inputField.prop('checked') ? 1 : 0 }
    };

    $ipe.defaults = {
        placeholder: "",
        value: null,
        size: "sm",
        url: null,
        submit: (data) => {},
        dismiss: (data) => {},
        ajax: {},
        data: []
    };

    $ipe.style = {
        linkText: {
            'border-bottom': "1px dashed gray",
            'color': '#0275d8'
        }
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
            InputConstructor: $ipe.InPlaceCheckBoxInput }
    };
}( jQuery ));