import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import Modal from "react-native-modal";
import DateTimePicker, { DateTimePickerProps } from "./DateTimePicker";

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
        <DateTimePicker {...rest} onClose={onClose} />
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
