'use strict';

let humanizeDuration = require('humanize-duration');

class SimpleBarReadout {
    constructor($scope, socket, interval) {
        this.scope = $scope;
        this.socket = socket;
        this.interval = interval;

        this.valuetype = this.scope.$parent.valuetype;
        this.scalevalue = 0;
        this.scaleprop = '0%';
        this.heightprop = '100px';
        this.value = 0;
        this.age = 0;
        this.max = 1;

        this.color = '#4384BF';

        console.log('[DASH-SBR] SimpleBarReadout loaded, observing:', this.valuetype);

        let self = this;
    
        self.scope.$on('resize', function (event, new_size) {
            console.log('Resizing to:', new_size);
            self.width = new_size[0];
            self.height = new_size[1];
            self.heightprop = self.height + "px";
            self.fontsizeprop = Math.min(self.width/2, self.height) + "px";
        });
    
        this.updateAge = function() {
            let seconds = new Date() / 1000;
            if (self.age === 0) {
                self.agehumanized = 'Unknown';
            } else {
                self.agehumanized = humanizeDuration(self.age - seconds, {round:true});
            }
        };

        this.handleNavdata = function (msg) {
            //console.log('[DASH-SBR] NAVDATA: ', msg, self.valuetype);
            if (msg.data.type === self.valuetype) {
                let data = msg.data;

                self.value = data.value;
                self.max = Math.max(self.value, self.max);
                self.scalevalue = (data.value / self.max) * 100;
                self.scaleprop =  String(self.scalevalue) + '%';
                self.age = data.timestamp;
                self.updateAge();

                //console.log('[DASH-SBR] Updating SimpleBarReadout: ', data, data.value, data.type, self.scalevalue);
                self.scope.$apply();
            }
        };

        this.interval(this.updateAge, 1000);
    
        self.socket.listen('hfos.navdata.sensors', self.handleNavdata);
    
        self.scope.$on('$destroy', function() {
            self.socket.unlisten('hfos.navdata.sensors', self.handleNavdata);
        });
    }
}

SimpleBarReadout.$inject = ['$scope', 'socket', '$interval'];

export default SimpleBarReadout;
