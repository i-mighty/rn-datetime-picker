import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import Modal from "react-native-modal";
import DateTimePicker, { DateTimePickerProps } from "./DateTimePicker";
import { SafeAreaView } from "react-native-safe-area-context";

interface DateTimePickerModalProps extends DateTimePickerProps {
  isVisible: boolean;
}

const DateTimePickerModal: React.FC<DateTimePickerModalProps> = (props) => {
  const { onClose, isVisible, ...rest } = props;

  return (
    <Modal
      backdropOpacity={0.5}
      style={{ justifyContent: "flex-end", margin: 0 }}
      useNativeDriver={true}
      onBackButtonPress={onClose}
      onBackdropPress={onClose}
      useNativeDriverForBackdrop={true}
      hideModalContentWhileAnimating={true}
      isVisible={isVisible}>
      <View style={styles.ModalWrapper}>
        <SafeAreaView>
          <DateTimePicker {...rest} onClose={onClose} />
        </SafeAreaView>
      </View>
    </Modal>
  );
};

DateTimePickerModal.defaultProps = {
  onClose: () => {},
  isVisible: true,
};

export default memo(DateTimePickerModal);

const styles = StyleSheet.create({
  ModalWrapper: {
    backgroundColor: "white",
    borderTopStartRadius: 8,
    borderTopEndRadius: 8,
  },
});
