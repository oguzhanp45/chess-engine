cmake_minimum_required(VERSION 3.13)
project(appmodules)

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

# jni -> main -> src -> app -> android -> (app kökü) -> chess-engine kökü
get_filename_component(CHESS_ENGINE_DIR
  "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../../engine" ABSOLUTE)

add_subdirectory(
  ${CHESS_ENGINE_DIR}
  ${CMAKE_BINARY_DIR}/chessengine_build
  EXCLUDE_FROM_ALL
)

# React Native appmodules hedefini -Wall -Werror ile derliyor. Motor
# başlıklarını "sistem başlığı" işaretleyerek onlardaki uyarıların
# uygulama derlemesini kırmasını engelliyoruz.
get_target_property(CHESS_ENGINE_INCLUDES chessengine INTERFACE_INCLUDE_DIRECTORIES)
set_property(TARGET chessengine PROPERTY
  INTERFACE_SYSTEM_INCLUDE_DIRECTORIES ${CHESS_ENGINE_INCLUDES})

target_sources(${CMAKE_PROJECT_NAME} PRIVATE
  ../../../../../shared/NativeChessEngine.cpp
)

target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC
  ../../../../../shared
)

target_link_libraries(${CMAKE_PROJECT_NAME} chessengine)