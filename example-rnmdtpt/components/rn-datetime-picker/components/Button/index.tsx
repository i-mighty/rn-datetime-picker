import {
  View,
  Text,
  TouchableWithoutFeedback,
  GestureResponderEvent,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

interface ButtonProps {
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  wrapperStyle?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = (props) => {
  const { onPress, children, wrapperStyle, textStyle, disabled } = props;

  return (
    <TouchableWithoutFeedback disabled={disabled != null ? false : disabled} onPress={onPress}>
      <View style={[styles.Wrapper, wrapperStyle]}>
        <Text style={[styles.TextWrapper, textStyle]}>{children}</Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Button;

const styles = StyleSheet.create({
  Wrapper: {
    borderWidth: 1.2,
    borderColor: "#598BFF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(1.5),
    width: "100%",
    borderRadius: 10,
  },
  TextWrapper: {
    fontSize: wp(4),
    color: "#598BFF",
    fontWeight: "bold",
  },
});
