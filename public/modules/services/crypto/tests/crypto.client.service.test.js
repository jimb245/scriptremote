'use strict'

describe('crypto service tests', function() {

    var cryptoSvc;
    var errMsg = 'some error msg';
    var okMsg = 'OK';

    // Inject the modules
    beforeEach(module('cryptoMod'));
    beforeEach(module('alertMod'));

    // Set the passphrase
    beforeEach(inject(function($window) {
        $window.sessionStorage.setItem('passphrase', '12345');
    }));

    // Get serice instance
    beforeEach(inject(function($injector) {
        cryptoSvc = $injector.get('CryptoSvc');
    }));

    it('should be able to decrypt text', inject(function(AlertSvc) {

        // Data from public/scripts/bash/test/set2/test1.sh to check
        // consistency with openssl encrypt
        var projectEncrypted = 'U2FsdGVkX1-slII4uiXmVW8Xsw-DGpF3f9W7zUTOOKcwGrM=';
        var projectPlain = 'TEST(set2)-Project1';
        var jobEncrypted = 'U2FsdGVkX19GMCrtzt-1+XvdDQ==';
        var jobPlain = 'Job';
        var locationEncrypted = 'U2FsdGVkX18u8mVyedamlxoABMZV2e-u';
        var locationPlain = 'Location';

        spyOn(AlertSvc, 'msgAlert');

        var plain = cryptoSvc.decrypt(null, projectEncrypted, false);
        expect(AlertSvc.msgAlert).not.toHaveBeenCalled();
        expect(plain).toEqual(projectPlain);

        plain = cryptoSvc.decrypt(null, jobEncrypted, false);
        expect(AlertSvc.msgAlert).not.toHaveBeenCalled();
        expect(plain).toEqual(jobPlain);

        plain = cryptoSvc.decrypt(null, locationEncrypted, false);
        expect(AlertSvc.msgAlert).not.toHaveBeenCalled();
        expect(plain).toEqual(locationPlain);

    }));

    it('normally just return null when decrypt fails', inject(function(AlertSvc) {

        spyOn(AlertSvc, 'resAlert');

        var projectEncrypted = 'Bad data';
        var plain = cryptoSvc.decrypt(null, projectEncrypted, false);

        expect(AlertSvc.resAlert).not.toHaveBeenCalled();
        expect(plain).toEqual(null);

    }));

    it('should be able to encrypt and authenticate text', inject(function(AlertSvc) {

        var namePlain = 'A';
        var valuePlain = 'Goodbye World';

        spyOn(AlertSvc, 'msgAlert');

        var nameEncrypted = cryptoSvc.encrypt(null, namePlain);
        expect(AlertSvc.msgAlert).not.toHaveBeenCalled();
        var plain = cryptoSvc.decrypt(null, nameEncrypted, false);
        expect(plain).toEqual(namePlain);

        var valueEncrypted = cryptoSvc.encrypt(null, valuePlain);
        expect(AlertSvc.msgAlert).not.toHaveBeenCalled();
        plain = cryptoSvc.decrypt(null, valueEncrypted, false);
        expect(plain).toEqual(valuePlain);

        var concat = nameEncrypted + valueEncrypted;
        var hmac = cryptoSvc.hmac(concat);
        expect(hmac.length).toEqual(64);

    }));

});

