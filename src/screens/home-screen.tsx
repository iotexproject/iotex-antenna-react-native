import { Button, Modal } from "@ant-design/react-native";
import * as React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { TopBar } from "../components/top-bar";
import { Interop } from "../interop";

type State = {
  shouldDisplayModal: boolean;
};

export default class HomeScreen extends React.Component<{}, State> {
  public static navigationOptions: { header: null } = {
    // tslint:disable-next-line
    header: null
  };

  public state: State = {
    shouldDisplayModal: false
  };

  private readonly onCloseModal = () => {
    this.setState({ shouldDisplayModal: false });
  };

  public render(): JSX.Element {
    return (
      <View style={styles.container}>
        <TopBar />
        <ScrollView style={styles.container}>
          <Modal
            popup
            transparent={false}
            visible={this.state.shouldDisplayModal}
            animationType="slide-up"
            onClose={this.onCloseModal}
          >
            <Interop />
            <Button
              onPress={() => {
                this.setState({ shouldDisplayModal: false });
              }}
            >
              Close DApp
            </Button>
          </Modal>
          <Button
            onPress={() => {
              this.setState({ shouldDisplayModal: true });
            }}
          >
            Open Claim Vita DApp in WebView
          </Button>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  }
});
