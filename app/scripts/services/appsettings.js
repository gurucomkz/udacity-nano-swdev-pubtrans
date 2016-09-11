/**
 * @ngdoc service
 * @name pubTransApp.AppSettings
 * @description
 * # AppSettings
 * Factory in the pubTransApp.
 */
angular.module('pubTransApp')

/*
	factory AppSettings

	Usage:
	variant 1)
		var settings = AppSettings.instance(); //получить КОПИЮ настроек
		var x = settings.get('foo');  //получить оттуда значение
		settings.set('foo', 2);		//записать одно значение (НЕ СОХРАНЕНО)
		settings.set('bar', 'ddd'); //записать еще одно значение (НЕ СОХРАНЕНО)
		settings.save() // сохранить все сделанные изменения (если были)
	variant 2)
		a = AppSettings.val('foo') //получить значение
		AppSettings.val('foo', 333);  //записать значение (сохраняется сразу)
*/
.factory('AppSettings', [

function() {
    'use strict';
    var me,
		_settingsKey = 'pubtransSettings',
        defaultSettings = {
            'lastOperator':null,
            'lastLine':null,
            'lastStart':null,
            'lastStop':null
        };

    function _retrieveSettings() {
        var settings = localStorage[_settingsKey];
        if(settings){
            return angular.fromJson(settings);
        }
        return defaultSettings;
    }

    function _saveSettings(settings) {
        localStorage[_settingsKey] = angular.toJson(settings);
    }

    return (me = {
        instance: function(){
			var _tmp = _retrieveSettings();
			return {
				get:function(k){
                    return typeof _tmp[k] === 'undefined' ? (defaultSettings[k] || null) : _tmp[k];
                },
				set:function(k,v){ _tmp[k] = v; return v; },
				save: function(){ _saveSettings(_tmp); }
			};
		},
		val: function(k, v)
        {
            var settings = _retrieveSettings();
            if(typeof v === 'undefined'){
                return typeof settings[k] === 'undefined' ? (defaultSettings[k] || null) : settings[k];
            }
            settings[k] = v;
            _saveSettings(settings);
            return me;
        }
    });
}]);
