import { StyleSheet, Text, View } from "react-native";
import { DateTimePicker } from "./components/rn-datetime-picker/index";

import "dayjs/locale/th";
import "dayjs/locale/zh";
export default function App() {
  return (
    <View style={styles.container}>
      <View>
        <DateTimePicker locale="zh" dateValue={new Date()} selectorMode="datetime" endMode="day" />
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
