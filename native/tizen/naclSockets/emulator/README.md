### Emulator usage
It is possible to test these functions in the emulator.  There are a few steps to make this work
* Emulator must be configured to use Bridged and not NAT networking.  
   * After selecting Bridged, you must manually create the bridge in Windows Network Connections
   * Assign the Network Bridge IP as per the original LAN connection IP
   * In the emulator network settings, specify the interface IP address (as per the previous point) and ensure an IP is assigned.  Confirm also that the DNS is set correctly.
* From the Debug build folder, it is necessary to copy the `naclSockets_i686.nexe` to the `native/tizen/naclSockets/emulator` directory.
   * Note: this will be a `32-bit` build to suit the emulator and not an `armv7` build as required on the TV.
   * The most recent build of this file should be stored in the `naclSockets/emulator` directory - just copy it to `native/tizen/naclSockets/emulator`

Refer to `README.md` in the tizenSockets project directory for the latest notes

_This file is primarily to ensure the otherwise empty `emulator` directory is maintained for convenience!_