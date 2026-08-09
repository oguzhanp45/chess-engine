# KONUM: app/android/app/src/main/jni/CMakeLists.txt
#
# Android tarafının C++ derlemesi buradan yönetilir.
# Yollar bu dosyanın bulunduğu klasöre göre: jni -> main -> src -> app ->
# android -> (app kökü). Yani 5 seviye yukarı çıkınca app kökündeyiz.

cmake_minimum_required(VERSION 3.13)

# React Native'in beklediği kütüphane adı. Değiştirme.
project(appmodules)

# React Native'in kendi CMake ayarlarını yükler.
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

# Kendi C++ kaynaklarımız.
target_sources(${CMAKE_PROJECT_NAME} PRIVATE
  ../../../../../shared/NativeChessEngine.cpp
)

# Başlık dosyalarının yeri.
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC
  ../../../../../shared
)

# ADIM 3'TE BURAYA EKLENECEK:
#   set(CHESS_ENGINE_ROOT ${CMAKE_CURRENT_SOURCE_DIR}/../../../../../../engine)
#   add_subdirectory(${CHESS_ENGINE_ROOT} chessengine_build)
#   target_link_libraries(${CMAKE_PROJECT_NAME} chessengine)
