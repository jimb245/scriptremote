'use strict'

//
// Service to encrypt/decrypt
//
angular.module('cryptoMod')

.factory('CryptoSvc', ['$window', 'AlertSvc', function ($window, AlertSvc) {

    // Encryption is AES-256-CTR
    //
    // Two formats supported:
    //
    // 'openssl enc' format: 'Salted__' + 8-byte-salt + ciphertext,
    // in base64. Uses openssl custom key and iv generation.
    //
    // 'alternate' format: 12-byte-salt + ciphertext, in base64.
    // iv is salt + 4-byte-counter, initially zero.
    // Single encryption key per project.  Key generation uses 
    // pbkdf2 with sha256 hash, a separate 8-byte salt, 
    // and 10000 rounds.
    //
    var service = {keySize: 32, ivSize: 16, passphrase: '', encrypted: false,
                    keyGenIters: 10000, opensslPrefix: 'Salted__', aesKeys: {}};

    service.init = function() {
        if ($window.localStorage.getItem('passphrase') && ($window.localStorage.getItem('passphrase') !== '')) {
            service.passphrase = $window.localStorage.getItem('passphrase');
            service.encrypted = true;
        }
        else if ($window.sessionStorage.getItem('passphrase') && ($window.sessionStorage.getItem('passphrase') !== '')) {
            service.passphrase = $window.sessionStorage.getItem('passphrase');
            service.encrypted = true;
        }
        else {
            service.passphrase = '';
            service.encrypted = false;
            service.aesKeys = {};
        }
    }

    // Compute project aes encryption key
    service.computeAESKey = function(project, salt) {
        // Projects using openssl format have empty project salt
        if (salt.length > 0) {
            var data64 = salt.replace(/-/g,'/');
            var binary = forge.util.decode64(data64);
            var buf = forge.util.createBuffer(binary, 'raw');
            salt = buf.getBytes(8)
            var key = forge.pkcs5.pbkdf2(service.passphrase, salt, service.keyGenIters, service.keySize, 'sha256');
            service.aesKeys[project] = key;
        }
    }

    // Decrypt a data item after ajax
    service.decryptBase = function(project, data, isBinary) {
        if (service.passphrase === '') {
            AlertSvc.msgAlert("error", "No passphrase found");
            return data;
        }
        // Using modified base64 to simplify url handling
        var data64 = data.replace(/-/g,'/');

        var binary = forge.util.decode64(data64);
        var input = forge.util.createBuffer(binary, 'raw');

        // Get key and iv
        var iv;
        var key;
        var salt;
        var buffer;
        if (project && (project in service.aesKeys)) {
            salt = input.getBytes(12);
            buffer = forge.util.createBuffer(salt);
            for (var i = 0; i < 4; i++) {
                buffer.putByte(0);
            }
            iv = buffer.getBytes(service.ivSize);
            key = service.aesKeys[project];
        }
        else {
            var prefix = input.getBytes(8);
            if (prefix != service.opensslPrefix)  {
                AlertSvc.msgAlert("error", "Data not in openssl format");
                return null;
            }
            salt = input.getBytes(8);
            var derivedBytes = forge.pbe.opensslDeriveBytes(service.passphrase, salt, service.keySize + service.ivSize);
            buffer = forge.util.createBuffer(derivedBytes);
            key = buffer.getBytes(service.keySize);
            iv = buffer.getBytes(service.ivSize);
        }
        //var salt16 = forge.util.bytesToHex(salt);
        //var key16 = forge.util.bytesToHex(key);
        //var iv16 = forge.util.bytesToHex(iv);

        // Decrypt
        var decipher = forge.cipher.createDecipher('AES-CTR', key);
        decipher.start({iv: iv});
        decipher.update(input);
        var result = decipher.finish();

        var output = '';
        if (result) {
            if (isBinary) {
                output = decipher.output.getBytes();
            }
            else {
                output = decipher.output.toString();
            }
        }
        else {
            AlertSvc.msgAlert("error", "Decryption failed");
        }
        return output;
    }

    // Decrypt a data item with error catch
    service.decrypt = function(project, data, isBinary) {
        if (service.passphrase === '') {
            AlertSvc.msgAlert("error", "No passphrase found");
            return data;
        }
        var plain = null;
        try {
            plain = service.decryptBase(project, data, isBinary);
        }
        catch(e) {
            return null;
        }
        if (!plain || (plain.length === 0)) {
            return null;
        }
        return plain;
    }

    // Encrypt a data item before ajax
    service.encryptBase = function(project, data) {
        if (service.passphrase === '') {
            AlertSvc.msgAlert("error", "No passphrase found");
            return data;
        }
        // Generate key and iv
        var key;
        var iv;
        var salt;
        var buffer;
        var openssl;
        if (project && (project in service.aesKeys)) {
            salt = forge.random.getBytesSync(12);
            buffer = forge.util.createBuffer(salt);
            for (var i = 0; i < 4; i++) {
                buffer.putByte(0);
            }
            iv = buffer.getBytes(service.ivSize);
            key = service.aesKeys[project];
            openssl = false;
        }
        else {
            salt = forge.random.getBytesSync(8);
            var derivedBytes = forge.pbe.opensslDeriveBytes(service.passphrase, salt, service.keySize + service.ivSize);
            buffer = forge.util.createBuffer(derivedBytes);
            key = buffer.getBytes(service.keySize);
            iv = buffer.getBytes(service.ivSize);
            openssl = true;
        }

        // Encrypt
        var input = forge.util.createBuffer(data, 'binary');
        var cipher = forge.cipher.createCipher('AES-CTR', key);
        cipher.start({iv: iv});
        cipher.update(input);
        cipher.finish();
        var ciphertext = cipher.output.getBytes();

        buffer = forge.util.createBuffer();
        if (openssl) {
            buffer.putBytes(service.opensslPrefix);
        }
        buffer.putBytes(salt);
        buffer.putBytes(ciphertext);

        var data64 = forge.util.encode64(buffer.getBytes());
        // Using modified base64 to simplify url handling
        var output = data64.replace(/\//g,'-');
        return output;
    }

    // Encrypt a data item with error catch
    service.encrypt = function(project, data) {
        var cipher;
        if (service.passphrase === '') {
            AlertSvc.msgAlert("error", "No passphrase found");
            return data;
        }
        var plain = null;
        try {
            cipher = service.encryptBase(project, data);
        }
        catch(e) {
            return null;
        }
        if (!cipher || (cipher.length === 0)) {
            return null;
        }
        return cipher;
    }

    service.hmac = function(data) {
        var hmac1 = forge.hmac.create();
        hmac1.start('sha256', service.passphrase);
        hmac1.update(data);
        return hmac1.digest().toHex();
    }

    service.isEncrypted = function() {
        return service.encrypted;
    }

    service.toBase64 = function(data) {
        return forge.util.encode64(data);
    }

    service.init();

    return service;
}])
