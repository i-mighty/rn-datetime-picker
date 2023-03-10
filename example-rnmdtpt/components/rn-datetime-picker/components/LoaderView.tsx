import React from "react";
import { View, StyleSheet } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

const LoaderView = () => {
  return <View style={styles.Wrapper}>{/* <Spinner size="medium" /> */}</View>;
};

export default LoaderView;

const styles = StyleSheet.create({
  Wrapper: {
    paddingHorizontal: wp(10),
    paddingVertical: hp(10),
    justifyContent: "center",
    alignItems: "center",
  },
});
