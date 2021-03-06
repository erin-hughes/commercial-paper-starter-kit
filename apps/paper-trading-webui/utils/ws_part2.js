'use strict';
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved.
 *
 * Communication between the CP browser code and this server is sent over web
 * sockets. This file has the code for processing and responding to message sent
 * to the web socket server.
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *   Dale Avery
 *******************************************************************************/

let TAG = 'web_socket:';

const composer = require('./composer.js');

// ==================================
// Part 2 - incoming messages, look for type
// ==================================

/**
     * Send a response back to the client.
     * @param {JSON} json The content of the response.
     * @param {Socket} socket socket to ouse
     */
function sendMsg(json,socket) {
    if (socket) {
        try {
            let dataToSend = JSON.stringify(json);
            console.log(`WebSocket Server Sening: ${dataToSend}`);
            socket.send(dataToSend);
        }
        catch (error) {
            console.error('Error sending response to client:', error.message);
        }
    }
}

module.exports.setup = function setup(peerHosts, chaincode_helper, useTLS) {

};

/**
 * A handler for incoming web socket messages.
 * @param {socket} socket A socket that we can respond through.
 * @param {object} data An object containing the incoming message data.
 */
module.exports.process_msg = async function (socket, data) {

    // Clients must specify the identity to use on their network.  Needs to be someone
    // that this server has enrolled and has the enrollment cert for.
    if (!data.user || data.user === '') {
        sendMsg({type: 'error', error: 'user not provided in message'},socket);
        return;
    }
    try {
        if (data.type === 'create') {
            if (data.paper && data.paper.ticker) {
                await composer.issueCP(data.paper,data);
            }
        }
        else if (data.type === 'get_papers' || data.type === 'get_open_trades') {
            console.log(TAG, 'getting papers');
            let papers= await composer.showMarket(data);
            sendMsg({msg: 'papers', market:'US_BLUE_ONE', papers: papers},socket);
        }
        else if (data.type === 'get_own_papers' ) {
            console.log(TAG, 'getting currently held papers');
            let papers= await composer.ownHoldings(data);
            sendMsg({msg: 'papers', market:'US_BLUE_ONE', papers: papers},socket);
        }
        else if (data.type === 'transfer_paper') {
            console.log(TAG, 'transferring paper:', data);
            await composer.transferCP(data);
        }
        else if (data.type === 'redeem_paper') {
            console.log(TAG, 'redeeming paper:', data);
            await composer.redeem(data);
        }
        else if (data.type === 'get_company') {
            // console.log(TAG, 'getting company information');
            let info = await composer.getCompany(data);
            console.log(TAG, 'getting company information '+info);
            sendMsg({msg: 'company', company: info},socket);
        }
        else if (data.type === 'chainstats') {
            console.log(TAG, 'Requesting chain stats from:');
        } else {
            console.log(TAG, `unkown ${data.type}`);
        }
    } catch (err){
        console.log(err.stack);
        throw err;
    }
};