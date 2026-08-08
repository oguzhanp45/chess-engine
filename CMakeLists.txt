# ============================================================
#  Satranc Motoru - CMake yapilandirmasi
# ============================================================
# Neden gerekli: depoyu klonlayan biri Visual Studio kullanmiyorsa
# projeyi derleyemez. CMake, Windows/Linux/macOS ve ileride Android
# NDK icin tek yapilandirma saglar.
#
# Kullanim:
#   cmake -B build -DCMAKE_BUILD_TYPE=Release
#   cmake --build build --config Release
cmake_minimum_required(VERSION 3.15)
project(SatrancMotoru VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
    set(CMAKE_BUILD_TYPE Release CACHE STRING "" FORCE)
endif()

find_package(Threads REQUIRED)

# --- Motor cekirdegi (kutuphane) ---
# Ayri bir kutuphane olmasi onemli: ileride React Native koprusu
# main.cpp'yi degil bu hedefi baglayacak.
add_library(chessengine STATIC
    Board.cpp
    MoveGen.cpp
    AI.cpp
    Polyglot.cpp
    Notation.cpp
    EngineApi.cpp
    Tests.cpp
)
target_include_directories(chessengine PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
target_link_libraries(chessengine PUBLIC Threads::Threads)

# --- UCI uygulamasi ---
add_executable(engine main.cpp)
target_link_libraries(engine PRIVATE chessengine)

if(MSVC)
    target_compile_options(chessengine PRIVATE /O2 /W3)
    target_compile_options(engine      PRIVATE /O2 /W3)
else()
    target_compile_options(chessengine PRIVATE -O3 -Wall -Wextra)
    target_compile_options(engine      PRIVATE -O3 -Wall -Wextra)
endif()