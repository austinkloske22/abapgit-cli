class-pool .
*"* class pool for class /COSS/CL_EVENT_GEN_TEST_DATA

*"* local type definitions
include /COSS/CL_EVENT_GEN_TEST_DATA==ccdef.

*"* class /COSS/CL_EVENT_GEN_TEST_DATA definition
*"* public declarations
  include /COSS/CL_EVENT_GEN_TEST_DATA==cu.
*"* protected declarations
  include /COSS/CL_EVENT_GEN_TEST_DATA==co.
*"* private declarations
  include /COSS/CL_EVENT_GEN_TEST_DATA==ci.
endclass. "/COSS/CL_EVENT_GEN_TEST_DATA definition

*"* macro definitions
include /COSS/CL_EVENT_GEN_TEST_DATA==ccmac.
*"* local class implementation
include /COSS/CL_EVENT_GEN_TEST_DATA==ccimp.

*"* test class
include /COSS/CL_EVENT_GEN_TEST_DATA==ccau.

class /COSS/CL_EVENT_GEN_TEST_DATA implementation.
*"* method's implementations
  include methods.
endclass. "/COSS/CL_EVENT_GEN_TEST_DATA implementation
