import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Platform } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import ShowOnProfile from "@/components/onboarding/ShowOnProfile";
import { useOnboarding } from "@/providers/OnboardingProvider";

const COUNTRIES = ["United States", "Canada", "Other"];
const US_STATES = ["California", "Texas", "New York", "Florida", "Washington", "Other"];
const CANADA_PROVINCES = ["Ontario", "British Columbia", "Quebec", "Alberta", "Other"];
const US_CITIES = ["Los Angeles", "New York", "Houston", "Chicago", "Other"];
const CANADA_CITIES = ["Toronto", "Vancouver", "Montreal", "Calgary", "Other"];

export default function FromScreen() {
  const { data, update } = useOnboarding();
  const [country, setCountry] = useState<string>(data.fromCountry ?? "");
  const [state, setState] = useState<string>(data.fromState ?? "");
  const [city, setCity] = useState<string>(data.fromCity ?? "");
  const [customCountry, setCustomCountry] = useState<string>("");
  const [customState, setCustomState] = useState<string>("");
  const [customCity, setCustomCity] = useState<string>("");
  const [show, setShow] = useState<boolean>(data.showLocation ?? true);
  const [activeDropdown, setActiveDropdown] = useState<"country" | "state" | "city" | null>(null);

  const selectedCountry = country === "Other" ? customCountry.trim() : country;
  const selectedState = state === "Other" ? customState.trim() : state;
  const selectedCity = city === "Other" ? customCity.trim() : city;

  const optionsForState = country === "United States" ? US_STATES : country === "Canada" ? CANADA_PROVINCES : [];
  const optionsForCity = country === "United States" ? US_CITIES : country === "Canada" ? CANADA_CITIES : [];

  const onNext = () => {
    update({
      fromCountry: selectedCountry,
      fromState: selectedState,
      fromCity: selectedCity,
      showLocation: show,
    });
    router.push("/(auth)/work");
  };

  const valid = Boolean(selectedCountry && selectedState && selectedCity);

  return (
    <OnboardingScreen
      step={7}
      total={19}
      gradient={[Colors.indigo, "#3c0a24", Colors.crimson] as const}
      footer={
        <View>
          <ShowOnProfile label="Show location on profile" value={show} onChange={setShow} testID="show-location" />
          <PillButton label="Next" onPress={onNext} disabled={!valid} variant="light" testID="from-next" />
        </View>
      }
    >
      <Text style={s.head}>Where are you from?</Text>
      <Text style={s.sub}>Choose your country, state, and city.</Text>

      <View style={{ height: 24 }} />
      <Text style={s.label}>Country</Text>
      <Pressable style={s.dropdown} onPress={() => setActiveDropdown(activeDropdown === "country" ? null : "country")} testID="country-dropdown">
        <Text style={[s.dropdownText, !country && s.placeholder]}>{country || "Select a country"}</Text>
      </Pressable>
      {activeDropdown === "country" && (
        <View style={s.dropdownList}>
          {COUNTRIES.map(item => (
            <Pressable key={item} style={s.dropdownItem} onPress={() => { setCountry(item); setState(""); setCity(""); setActiveDropdown(null); }} testID={`country-${item.replace(/\s+/g, "-").toLowerCase()}`}>
              <Text style={s.dropdownItemText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {country === "Other" && (
        <TextInput
          style={s.input}
          placeholder="Enter your country"
          placeholderTextColor="rgba(245,240,235,0.4)"
          value={customCountry}
          onChangeText={setCustomCountry}
          testID="country-other"
        />
      )}

      <View style={{ height: 18 }} />
      <Text style={s.label}>State / Province</Text>
      <Pressable style={s.dropdown} onPress={() => setActiveDropdown(activeDropdown === "state" ? null : "state")} testID="state-dropdown">
        <Text style={[s.dropdownText, !state && s.placeholder]}>{state || "Select a state or province"}</Text>
      </Pressable>
      {activeDropdown === "state" && country !== "Other" && (
        <View style={s.dropdownList}>
          {optionsForState.map(item => (
            <Pressable key={item} style={s.dropdownItem} onPress={() => { setState(item); setCity(""); setActiveDropdown(null); }} testID={`state-${item.replace(/\s+/g, "-").toLowerCase()}`}>
              <Text style={s.dropdownItemText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {activeDropdown === "state" && country === "Other" && (
        <TextInput
          style={s.input}
          placeholder="Enter your state or region"
          placeholderTextColor="rgba(245,240,235,0.4)"
          value={customState}
          onChangeText={setCustomState}
          testID="state-other"
        />
      )}

      <View style={{ height: 18 }} />
      <Text style={s.label}>City</Text>
      <Pressable style={s.dropdown} onPress={() => setActiveDropdown(activeDropdown === "city" ? null : "city")} testID="city-dropdown">
        <Text style={[s.dropdownText, !city && s.placeholder]}>{city || "Select a city"}</Text>
      </Pressable>
      {activeDropdown === "city" && country !== "Other" && (
        <View style={s.dropdownList}>
          {optionsForCity.map(item => (
            <Pressable key={item} style={s.dropdownItem} onPress={() => { setCity(item); setActiveDropdown(null); }} testID={`city-${item.replace(/\s+/g, "-").toLowerCase()}`}>
              <Text style={s.dropdownItemText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {activeDropdown === "city" && country === "Other" && (
        <TextInput
          style={s.input}
          placeholder="Enter your city"
          placeholderTextColor="rgba(245,240,235,0.4)"
          value={customCity}
          onChangeText={setCustomCity}
          testID="city-other"
        />
      )}

      {(country === "Other" || state === "Other" || city === "Other") && (
        <View style={{ height: 8 }} />
      )}
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
  label: { color: Colors.dark.text, fontSize: 14, fontWeight: "700" as const, marginBottom: 8 },
  dropdown: { borderWidth: 1.5, borderColor: "rgba(245,240,235,0.18)", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "rgba(255,255,255,0.04)" },
  dropdownText: { color: Colors.dark.text, fontSize: 15, fontWeight: "600" as const },
  placeholder: { color: Colors.dark.textDim },
  dropdownList: { marginTop: 8, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1.5, borderColor: "rgba(245,240,235,0.18)" },
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "rgba(245,240,235,0.08)" },
  dropdownItemText: { color: Colors.dark.text, fontSize: 15 },
  input: { marginTop: 10, borderWidth: 1.5, borderColor: "rgba(245,240,235,0.18)", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: Colors.dark.text, fontSize: 15, backgroundColor: "rgba(255,255,255,0.04)" },
});
