import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DateTimePicker, DateTimePickerModal } from "./components/rn-datetime-picker/index";

import "dayjs/locale/th";
import "dayjs/locale/zh";
import { useState } from "react";
export default function App() {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <View style={styles.container}>
      <View>
        <TouchableOpacity onPress={() => setIsVisible(!isVisible)}>
          <Text>Show Modal</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isVisible}
          activeColor="#4B0082"
          locale="zh"
          dateValue={new Date()}
          selectorMode="datetime"
          endMode="day"
          onConfirm={() => setIsVisible(!isVisible)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginVertical: 100,
  },
});
