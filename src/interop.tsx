/* tslint:disable:no-console */
import Antenna from "iotex-antenna";
import { Envelop, SealedEnvelop } from "iotex-antenna/lib/action/envelop";
import React, { Component } from "react";
import { Dimensions, Text, View, WebView } from "react-native";
import sleepPromise from "sleep-promise";

const { height } = Dimensions.get("window");

const antenna = new Antenna("https://iotexscan.io/iotex-core-proxy");
const account = antenna.iotx.accounts.privateKeyToAccount("redacted");

interface IRequest {
  reqId: number;
  type: "SIGN_AND_SEND" | "GET_ACCOUNTS";

  envelop?: string; // serialized proto string
}

type State = {
  actionHash: string;
};

export class Interop extends Component<{}, State> {
  public state: State = { actionHash: "" };

  public webViewRef: WebView | null;

  public async signAndSend(envelopMessage: string): Promise<string> {
    const envelop = Envelop.deserialize(
      Buffer.from(envelopMessage || "", "hex")
    );

    // fetch latest nonce for the envelop
    const meta = await antenna.iotx.getAccount({
      address: account.address
    });
    envelop.nonce = String(
      (meta.accountMeta && meta.accountMeta.pendingNonce) || ""
    );

    // sign envelop
    const sealed = SealedEnvelop.sign(
      String(account && account.privateKey),
      String(account && account.publicKey),
      envelop
    );

    // broadcast envelop
    const { actionHash } = await antenna.iotx.sendAction({
      action: sealed.action()
    });

    return actionHash;
  }

  public async handleWvMessage(message: string): Promise<void> {
    if (!this.webViewRef) {
      return;
    }

    let messageObj: IRequest;
    try {
      messageObj = JSON.parse(message);
    } catch (err) {
      console.error(`failed to parse message from web view ${err}`);
      return;
    }

    if (messageObj.type === "GET_ACCOUNTS") {
      const resp = {
        reqId: messageObj.reqId,
        accounts: [{ address: account.address }]
      };
      console.log(`sending back: ${JSON.stringify(resp)}`);
      this.webViewRef.postMessage(JSON.stringify(resp));
    } else {
      if (!messageObj.envelop) {
        return;
      }
      const actionHash = await this.signAndSend(messageObj.envelop);

      const resp = { reqId: messageObj.reqId, actionHash };

      console.log(`sending back: ${JSON.stringify(resp)}`);

      // user spend 3 seconds to confirm it
      await sleepPromise(3000);

      this.webViewRef.postMessage(JSON.stringify(resp));

      this.setState({ actionHash });
    }
  }

  public render(): JSX.Element {
    return (
      <View style={{ flex: 1, flexDirection: "column" }}>
        <WebView
          originWhitelist={["*"]}
          source={{
            // tslint:disable-next-line:no-http-string
            uri: "https://iopay.iotex.io/claim-vita"
          }}
          style={{
            alignSelf: "stretch",
            backgroundColor: "blue",
            marginTop: 40,
            height: height - 120
          }}
          useWebKit={true}
          onMessage={async event => {
            const decoded = decodeURIComponent(
              decodeURIComponent(event.nativeEvent.data)
            );
            console.log(`received message: ${decoded}`);
            await this.handleWvMessage(decoded);
          }}
          ref={webView => {
            this.webViewRef = webView;
          }}
        />
        <Text>
          {this.state.actionHash
            ? `Wallet broadcast tx: ${this.state.actionHash}`
            : "Wallet did not receive any request"}
        </Text>
      </View>
    );
  }
}
